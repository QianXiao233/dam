/**
 * 智御安澜 WAF 防火墙核心模块
 * 
 * 功能：
 * - 纯 IP 黑白名单规则引擎
 * - Express 中间件：请求拦截/放行
 * - 风控上报：同一 IP 多次触发自动拉黑
 * - RESTful API 管理接口
 */
const fs = require('fs');
const path = require('path');

// ======================== WAF 核心类 ========================

class WAF {
  /**
   * @param {Object} options
   * @param {string}  options.rulesPath      - 规则文件路径（默认 waf_rules.json）
   * @param {boolean} options.whitelistMode  - true=白名单模式(false=黑名单模式)
   * @param {string[]} options.whitelistPaths - 不做拦截的路径前缀
   */
  constructor(options = {}) {
    this.rulesPath = options.rulesPath || path.join(__dirname, 'waf_rules.json');
    this.whitelistMode = options.whitelistMode || false;
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

    // 设备表: Map<ip, { ip, firstSeen, lastSeen, requestCount, blocked, userAgent }>
    this.devices = new Map();
    
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
    
    console.log(`[WAF] ✅ 防火墙已加载 (模式: ${this.whitelistMode ? '白名单' : '黑名单'}, 规则数: ${this.rules.length})`);
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
   * @param {Object} rule - { type: 'allow'|'block', value: '...', comment: '' }
   * @returns {Object} 添加的规则（含 id）
   */
  addRule(rule) {
    if (!rule.type || !['allow', 'block'].includes(rule.type)) {
      throw new Error('规则类型必须是 allow 或 block');
    }
    if (!rule.value) {
      throw new Error('规则值不能为空');
    }

    const value = rule.value.trim();

    // 查重
    const exists = this.rules.some(r => r.value === value);
    if (exists) throw new Error('该规则已存在');

    const newRule = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      type: rule.type,
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
  checkRequest(ip) {
    this.stats.totalRequests++;
    
    // 查找匹配的 IP 规则
    const matchedRule = this.rules.find(r => r.value === ip);

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
  recordDevice(ip, userAgent) {
    const now = Date.now();
    let device = this.devices.get(ip);
    
    if (device) {
      device.lastSeen = now;
      device.requestCount++;
      if (userAgent) device.userAgent = userAgent;
    } else {
      device = {
        ip,
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
        online: (now - device.lastSeen) < 60000, // 1分钟内算在线
        firstSeen: new Date(device.firstSeen).toISOString(),
        lastSeen: new Date(device.lastSeen).toISOString()
      });
    }
    // 按最后访问时间倒序
    result.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
    return result;
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

      // 记录设备
      const device = self.recordDevice(cleanIP, req.headers['user-agent']);

      // 检查规则
      const result = self.checkRequest(cleanIP);
      
      if (!result.allowed) {
        device.blocked = true;
        
        // 根据请求类型返回不同格式
        const accept = req.headers.accept || '';
        if (accept.includes('application/json') || req.xhr) {
          return res.status(403).json({
            error: 'FORBIDDEN',
            message: `[WAF] ${result.reason}`,
            yourIP: cleanIP
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
              <div class="ip">IP: ${cleanIP}</div>
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
        const { type, value, comment } = req.body;
        const rule = self.addRule({ type, value, comment });
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

    return router;
  }
}

module.exports = WAF;
