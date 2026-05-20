/**
 * 智御安澜 WAF 防火墙核心模块
 * 
 * 功能：
 * - 解析 ARP 表获取同局域网设备 MAC 地址
 * - IP + MAC 双因子黑白名单规则引擎
 * - Express 中间件：请求拦截/放行
 * - RESTful API 管理接口
 */
const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const os = require('os');

// ======================== ARP 表解析器 ========================

/**
 * 解析 Windows 系统 `arp -a` 输出
 */
function parseArpWindows(output) {
  const devices = [];
  // Windows arp -a 格式:
  //   Interface: 192.168.1.1 --- 0x5
  //     Internet Address    Physical Address    Type
  //     192.168.1.100      00-11-22-33-44-55   dynamic
  const lines = output.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // 匹配形如 "192.168.1.100      00-11-22-33-44-55   dynamic" 的行
    const match = trimmed.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+([0-9a-fA-F-]{17,})\s+(dynamic|static)/);
    if (match) {
      devices.push({
        ip: match[1],
        mac: match[2].replace(/-/g, ':').toLowerCase(),
        type: match[3]
      });
    }
  }
  return devices;
}

/**
 * 解析 Linux `arp -a` 或 `ip neigh` 输出
 */
function parseArpLinux(output) {
  const devices = [];
  const lines = output.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // ip neigh 格式: "192.168.1.100 dev eth0 lladdr 00:11:22:33:44:55 REACHABLE"
    let match = trimmed.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}).+lladdr\s+([0-9a-fA-F:]{17,})\s+/);
    if (match) {
      devices.push({
        ip: match[1],
        mac: match[2].toLowerCase(),
        type: 'dynamic'
      });
      continue;
    }
    // arp -a 格式: "? (192.168.1.100) at 00:11:22:33:44:55 [ether] on eth0"
    match = trimmed.match(/\((\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\)\s+at\s+([0-9a-fA-F:]{17,})/);
    if (match) {
      devices.push({
        ip: match[1],
        mac: match[2].toLowerCase(),
        type: 'dynamic'
      });
    }
  }
  return devices;
}

/**
 * 解析 macOS `arp -a` 输出
 */
function parseArpMac(output) {
  const devices = [];
  const lines = output.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // macOS arp -a 格式:
    // "? (192.168.1.100) at 0:11:22:33:44:55 on en0 ifscope [ethernet]"
    const match = trimmed.match(/\((\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\)\s+at\s+([0-9a-fA-F:]+)/);
    if (match) {
      let mac = match[2].toLowerCase();
      // macOS 的 MAC 地址可能省略前导零，如 "0:11:22:33:44:55" → "00:11:22:33:44:55"
      const parts = mac.split(':');
      if (parts.length === 6) {
        mac = parts.map(p => p.padStart(2, '0')).join(':');
      }
      devices.push({
        ip: match[1],
        mac,
        type: 'dynamic'
      });
    }
  }
  return devices;
}

/**
 * 根据操作系统自动选择 ARP 解析器
 */
function getArpParser() {
  const platform = os.platform();
  if (platform === 'win32') return { cmd: 'arp -a', parser: parseArpWindows };
  if (platform === 'darwin') return { cmd: 'arp -a', parser: parseArpMac };
  // Linux: 优先使用 ip neigh（更可靠），回退 arp -a
  return { cmd: 'ip neigh 2>/dev/null || arp -a 2>/dev/null', parser: parseArpLinux };
}

// ======================== MAC 地址格式化 ========================

/**
 * 统一 MAC 格式为 xx:xx:xx:xx:xx:xx
 */
function normalizeMac(mac) {
  if (!mac) return null;
  // 去除多余字符，只保留十六进制和冒号
  let cleaned = mac.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
  if (cleaned.length !== 12) return null;
  return cleaned.match(/.{2}/g).join(':');
}

// ======================== WAF 核心类 ========================

class WAF {
  /**
   * @param {Object} options
   * @param {string}  options.rulesPath    - 规则文件路径（默认 waf_rules.json）
   * @param {boolean} options.whitelistMode - true=白名单模式(false=黑名单模式)
   * @param {number}  options.arpTTL       - ARP 缓存刷新间隔(ms)
   * @param {string[]} options.whitelistPaths - 不做拦截的路径前缀
   */
  constructor(options = {}) {
    this.rulesPath = options.rulesPath || path.join(__dirname, 'waf_rules.json');
    this.whitelistMode = options.whitelistMode || false;
    this.arpTTL = options.arpTTL || 30000; // 30s
    this.hookThreshold = options.hookThreshold || 3;  // 同一 IP 触发风控 N 次后自动拉黑
    this.hookReports = new Map();  // Map<ip, { count, firstReported, lastReported, banned }>

    this.whitelistPaths = options.whitelistPaths || [
      '/api/waf',  // WAF 管理 API 本身不拦截
      '/js/',      // 静态资源
      '/css/',
      '/fonts/',
      '/images/',
      '/imagesT/',
      '/model/',
      '/sound/',
      '/video/',
      '/build/',
      '/jsm/',
      '/favicon.ico'
    ];

    // 设备表: Map<ip, { ip, mac, firstSeen, lastSeen, requestCount, blocked, userAgent }>
    this.devices = new Map();
    
    // ARP 缓存
    this._arpDevices = [];
    this._arpLastUpdate = 0;
    
    // 统计
    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      allowedRequests: 0,
      uniqueDevices: 0,
      startTime: Date.now()
    };

    // 加载持久化规则
    this.rules = this._loadRules();
    
    // 初始化 ARP 缓存
    this._refreshARP();
    
    console.log(`[WAF] ✅ 防火墙已加载 (模式: ${this.whitelistMode ? '白名单' : '黑名单'}, 规则数: ${this.rules.length})`);
  }

  // ======================== ARP 解析 ========================

  /**
   * 刷新 ARP 缓存
   */
  _refreshARP() {
    try {
      const { cmd, parser } = getArpParser();
      const output = execSync(cmd, { timeout: 5000, encoding: 'utf-8' });
      this._arpDevices = parser(output);
      this._arpLastUpdate = Date.now();
      
      // 更新已知设备的 MAC
      for (const entry of this._arpDevices) {
        const device = this.devices.get(entry.ip);
        if (device && entry.mac) {
          device.mac = entry.mac;
        }
      }
    } catch (err) {
      // ARP 命令失败时静默处理（可能是权限问题）
      if (this._arpDevices.length === 0) {
        console.warn('[WAF] ⚠️ ARP 解析失败，MAC 地址功能不可用:', err.message);
      }
    }
  }

  /**
   * 获取指定 IP 的 MAC 地址（从 ARP 缓存查找）
   */
  _resolveMAC(ip) {
    // 检查缓存是否过期
    if (Date.now() - this._arpLastUpdate > this.arpTTL) {
      this._refreshARP();
    }
    
    // 精确查找
    const entry = this._arpDevices.find(d => d.ip === ip);
    if (entry && entry.mac) return entry.mac;
    
    // 尝试主动触发 ARP（ping）
    try {
      execSync(`ping -n 1 -w 500 ${ip} 2>&1 || ping -c 1 -W 1 ${ip} 2>&1`, { timeout: 2000, encoding: 'utf-8' });
      // ping 后重新刷新 ARP
      this._refreshARP();
      const entry2 = this._arpDevices.find(d => d.ip === ip);
      if (entry2 && entry2.mac) return entry2.mac;
    } catch (_) {}
    
    return null;
  }

  // ======================== 规则管理 ========================

  _loadRules() {
    try {
      if (fs.existsSync(this.rulesPath)) {
        const data = fs.readFileSync(this.rulesPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.warn('[WAF] ⚠️ 规则文件读取失败，使用空规则集:', err.message);
    }
    return [];
  }

  _saveRules() {
    try {
      fs.writeFileSync(this.rulesPath, JSON.stringify(this.rules, null, 2), 'utf-8');
    } catch (err) {
      console.error('[WAF] ❌ 规则保存失败:', err.message);
    }
  }

  /**
   * 添加规则
   * @param {Object} rule - { type: 'allow'|'block', target: 'ip'|'mac', value: '...', comment: '' }
   * @returns {Object} 添加的规则（含 id）
   */
  addRule(rule) {
    if (!rule.type || !['allow', 'block'].includes(rule.type)) {
      throw new Error('规则类型必须是 allow 或 block');
    }
    if (!rule.target || !['ip', 'mac'].includes(rule.target)) {
      throw new Error('规则目标必须是 ip 或 mac');
    }
    if (!rule.value) {
      throw new Error('规则值不能为空');
    }

    // MAC 地址标准化
    let value = rule.value.trim();
    if (rule.target === 'mac') {
      value = normalizeMac(value);
      if (!value) throw new Error('MAC 地址格式无效');
    }

    // 查重
    const exists = this.rules.some(r => r.target === rule.target && r.value === value);
    if (exists) throw new Error('该规则已存在');

    const newRule = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      type: rule.type,
      target: rule.target,
      value,
      comment: rule.comment || '',
      createdAt: new Date().toISOString(),
      hitCount: 0
    };

    this.rules.push(newRule);
    this._saveRules();
    return newRule;
  }

  /**
   * 删除规则
   */
  deleteRule(id) {
    const idx = this.rules.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('规则不存在');
    this.rules.splice(idx, 1);
    this._saveRules();
    return true;
  }

  /**
   * 切换黑白名单模式
   */
  setMode(whitelistMode) {
    this.whitelistMode = !!whitelistMode;
    console.log(`[WAF] 🔄 切换为 ${this.whitelistMode ? '白名单' : '黑名单'} 模式`);
    return this.whitelistMode;
  }

  // ======================== 请求检查 ========================

  /**
   * 检查请求是否应该被拦截
   * @returns {Object} { allowed, reason, matchedRule }
   */
  checkRequest(ip, mac) {
    this.stats.totalRequests++;
    
    // 查找匹配的规则（MAC 优先，IP 其次）
    let matchedRule = null;
    
    // 先查 MAC 规则（如果有 MAC）
    if (mac) {
      const macRule = this.rules.find(r => r.target === 'mac' && r.value === mac);
      if (macRule) matchedRule = macRule;
    }
    
    // 再查 IP 规则
    if (!matchedRule) {
      const ipRule = this.rules.find(r => r.target === 'ip' && r.value === ip);
      if (ipRule) matchedRule = ipRule;
    }

    // 白名单模式：只有 allow 规则匹配才放行，其他全拦截
    if (this.whitelistMode) {
      if (matchedRule && matchedRule.type === 'allow') {
        this.stats.allowedRequests++;
        return { allowed: true, reason: '白名单匹配放行', matchedRule };
      }
      this.stats.blockedRequests++;
      if (matchedRule) matchedRule.hitCount++;
      this._saveRules();
      return { allowed: false, reason: '白名单模式：未在白名单中', matchedRule: null };
    }

    // 黑名单模式：block 规则匹配则拦截
    if (matchedRule && matchedRule.type === 'block') {
      this.stats.blockedRequests++;
      matchedRule.hitCount++;
      this._saveRules();
      return { allowed: false, reason: `黑名单匹配: ${matchedRule.comment || matchedRule.value}`, matchedRule };
    }

    // 默认放行
    this.stats.allowedRequests++;
    return { allowed: true, reason: '无匹配规则，默认放行', matchedRule: null };
  }

  // ======================== 风控上报 ========================

  /**
   * 处理前端风控上报 —— 同一 IP 多次触发自动拉黑
   * @param {string} ip - 客户端 IP
   * @returns {Object} { count, threshold, banned, autoRule }
   */
  reportHook(ip) {
    const now = Date.now();
    let report = this.hookReports.get(ip);

    if (!report) {
      report = { count: 0, firstReported: now, lastReported: now, banned: false };
      this.hookReports.set(ip, report);
    }

    report.count++;
    report.lastReported = now;

    // 检查是否达到阈值且尚未被拉黑
    if (report.count >= this.hookThreshold && !report.banned) {
      report.banned = true;
      try {
        const rule = this.addRule({
          type: 'block',
          target: 'ip',
          value: ip,
          comment: `[自动拉黑] 前端风控触发 ${report.count} 次`
        });
        console.log(`[WAF] 🤖 自动拉黑 IP ${ip}（风控触发 ${report.count} 次）`);
        return { count: report.count, threshold: this.hookThreshold, banned: true, autoRule: rule };
      } catch (err) {
        // 规则可能已存在（重复上报），不算失败
        console.log(`[WAF] ⚠️ 自动拉黑 IP ${ip} 时: ${err.message}`);
        return { count: report.count, threshold: this.hookThreshold, banned: true, autoRule: null };
      }
    }

    return { count: report.count, threshold: this.hookThreshold, banned: false, autoRule: null };
  }

  /**
   * 获取风控上报统计
   */
  getHookReportStats() {
    const result = [];
    for (const [ip, report] of this.hookReports) {
      result.push({
        ip,
        count: report.count,
        firstReported: new Date(report.firstReported).toISOString(),
        lastReported: new Date(report.lastReported).toISOString(),
        banned: report.banned
      });
    }
    result.sort((a, b) => b.count - a.count);
    return result;
  }

  // ======================== 设备管理 ========================

  /**
   * 记录/更新设备信息
   */
  recordDevice(ip, mac, userAgent) {
    const now = Date.now();
    let device = this.devices.get(ip);
    
    if (device) {
      device.lastSeen = now;
      device.requestCount++;
      if (mac && !device.mac) device.mac = mac;
      if (userAgent) device.userAgent = userAgent;
    } else {
      device = {
        ip,
        mac: mac || null,
        firstSeen: now,
        lastSeen: now,
        requestCount: 1,
        blocked: false,
        userAgent: userAgent || ''
      };
      this.devices.set(ip, device);
      this.stats.uniqueDevices = this.devices.size;
    }
    
    return device;
  }

  /**
   * 获取设备列表（含在线状态）
   */
  getDevices() {
    const now = Date.now();
    const result = [];
    for (const device of this.devices.values()) {
      result.push({
        ...device,
        mac: device.mac || null,
        online: (now - device.lastSeen) < 60000, // 1分钟内算在线
        firstSeen: new Date(device.firstSeen).toISOString(),
        lastSeen: new Date(device.lastSeen).toISOString()
      });
    }
    // 按最后访问时间倒序
    result.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
    return result;
  }

  /**
   * 扫描网络并尝试解析所有已知设备的 MAC
   */
  scanNetwork() {
    this._refreshARP();
    
    // 通过 ARP 表发现新设备
    for (const arp of this._arpDevices) {
      if (arp.mac && !this.devices.has(arp.ip)) {
        this.devices.set(arp.ip, {
          ip: arp.ip,
          mac: arp.mac,
          firstSeen: Date.now(),
          lastSeen: Date.now(),
          requestCount: 0,
          blocked: false,
          userAgent: '(ARP 发现)'
        });
      }
    }
    this.stats.uniqueDevices = this.devices.size;
    return this._arpDevices;
  }

  // ======================== Express 中间件 ========================

  /**
   * 创建 Express 中间件（拦截请求）
   */
  middleware() {
    const self = this;

    return (req, res, next) => {
      // 白名单路径跳过检查（静态资源、WAF API 等）
      const skip = self.whitelistPaths.some(p => req.path.startsWith(p));
      if (skip) return next();

      // 获取客户端 IP
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.ip
        || req.socket?.remoteAddress
        || 'unknown';
      
      // 标准化 IPv6 映射地址
      const cleanIP = ip.replace(/^::ffff:/, '');

      // 解析 MAC
      const mac = self._resolveMAC(cleanIP);

      // 记录设备
      const device = self.recordDevice(cleanIP, mac, req.headers['user-agent']);

      // 检查规则
      const result = self.checkRequest(cleanIP, mac);
      
      if (!result.allowed) {
        device.blocked = true;
        
        // 根据请求类型返回不同格式
        const accept = req.headers.accept || '';
        if (accept.includes('application/json') || req.xhr) {
          return res.status(403).json({
            error: 'FORBIDDEN',
            message: `[WAF] ${result.reason}`,
            yourIP: cleanIP,
            yourMAC: mac || 'unknown'
          });
        }
        
        // HTML 页面返回拦截页
        return res.status(403).type('html').send(`
          <!DOCTYPE html>
          <html lang="zh-CN">
          <head><meta charset="UTF-8"><title>访问被拦截 - WAF</title>
          <style>
            body { margin:0; display:flex; justify-content:center; align-items:center; 
                   height:100vh; background:#1a1a2e; font-family:Microsoft YaHei,sans-serif; }
            .card { background:rgba(255,255,255,0.95); padding:40px 50px; border-radius:16px;
                    text-align:center; box-shadow:0 10px 40px rgba(0,0,0,0.5); }
            h1 { color:#e74c3c; font-size:28px; margin-bottom:10px; }
            .ip { background:#f0f0f0; padding:8px 16px; border-radius:8px; font-family:monospace; margin:16px 0; }
            .reason { color:#666; font-size:14px; margin-bottom:16px; }
            .icon { font-size:64px; margin-bottom:10px; }
          </style>
          </head>
          <body>
            <div class="card">
              <div class="icon">🚫</div>
              <h1>访问被 WAF 拦截</h1>
              <div class="reason">${result.reason}</div>
              <div class="ip">IP: ${cleanIP}${mac ? ' | MAC: ' + mac : ''}</div>
              <p style="color:#999;font-size:12px;">智御安澜 WAF 防火墙</p>
            </div>
          </body>
          </html>
        `);
      }

      next();
    };
  }

  // ======================== RESTful API ========================

  /**
   * 创建 Express 路由
   */
  createRouter() {
    const express = require('express');
    const router = express.Router();
    const self = this;

    // 获取 WAF 统计信息
    router.get('/stats', (req, res) => {
      res.json({
        success: true,
        data: {
          ...self.stats,
          uptime: Date.now() - self.stats.startTime,
          mode: self.whitelistMode ? 'whitelist' : 'blacklist',
          ruleCount: self.rules.length,
          deviceCount: self.devices.size,
          arpEntries: self._arpDevices.length,
          hookThreshold: self.hookThreshold,
          hookReportCount: self.hookReports.size,
          hookBannedCount: [...self.hookReports.values()].filter(r => r.banned).length
        }
      });
    });

    // 获取设备列表
    router.get('/devices', (req, res) => {
      res.json({
        success: true,
        data: self.getDevices()
      });
    });

    // 获取规则列表
    router.get('/rules', (req, res) => {
      res.json({
        success: true,
        data: self.rules
      });
    });

    // 添加规则
    router.post('/rules', (req, res) => {
      try {
        const { type, target, value, comment } = req.body;
        const rule = self.addRule({ type, target, value, comment });
        res.json({ success: true, data: rule });
      } catch (err) {
        res.status(400).json({ success: false, error: err.message });
      }
    });

    // 删除规则
    router.delete('/rules/:id', (req, res) => {
      try {
        self.deleteRule(req.params.id);
        res.json({ success: true });
      } catch (err) {
        res.status(404).json({ success: false, error: err.message });
      }
    });

    // 切换黑白名单模式
    router.put('/mode', (req, res) => {
      const mode = req.body.mode === 'whitelist';
      self.setMode(mode);
      res.json({
        success: true,
        data: { mode: mode ? 'whitelist' : 'blacklist' }
      });
    });

    // 前端风控上报 —— 同一 IP 多次触发自动拉黑
    router.post('/report-hook', (req, res) => {
      // 从请求中获取真实 IP
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.ip
        || req.socket?.remoteAddress
        || 'unknown';
      const cleanIP = ip.replace(/^::ffff:/, '');

      const result = self.reportHook(cleanIP);
      console.log(`[WAF] 🚨 前端风控上报 from ${cleanIP}（第 ${result.count}/${result.threshold} 次）${result.banned ? '→ 已拉黑！' : ''}`);

      res.json({
        success: true,
        data: {
          ip: cleanIP,
          count: result.count,
          threshold: result.threshold,
          banned: result.banned
        }
      });
    });

    // 获取风控上报历史
    router.get('/hook-reports', (req, res) => {
      res.json({
        success: true,
        data: self.getHookReportStats()
      });
    });

    // 扫描网络
    router.post('/scan', (req, res) => {
      const devices = self.scanNetwork();
      res.json({
        success: true,
        data: { arpEntries: devices.length, totalDevices: self.devices.size }
      });
    });

    return router;
  }
}

module.exports = WAF;
