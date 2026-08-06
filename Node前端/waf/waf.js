/**
 * WAF 防火墙核心模块
 * - 提取客户端 IP 和 MAC 地址
 * - 黑白名单规则匹配
 * - 连接日志记录
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ========== 路径配置 ==========
const RULES_FILE = path.join(__dirname, 'rules.json');
const CONNECTIONS_FILE = path.join(__dirname, 'connections.log');
const MAX_LOG_ENTRIES = 10000;       // 最多保留条数
const CLEANUP_INTERVAL = 15 * 60 * 1000; // 每15分钟清理一次旧日志

// ========== 规则存储 ==========

/** 读取规则文件 */
function loadRules() {
    try {
        const raw = fs.readFileSync(RULES_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch {
        return { mode: 'blacklist', rules: [] };
    }
}

/** 保存规则到文件 */
function saveRules(data) {
    fs.writeFileSync(RULES_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/** 读取连接日志 */
function loadConnections() {
    try {
        const raw = fs.readFileSync(CONNECTIONS_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

/** 保存连接日志到文件 */
function saveConnections(connections) {
    // 限制日志数量
    if (connections.length > MAX_LOG_ENTRIES) {
        connections = connections.slice(-MAX_LOG_ENTRIES);
    }
    fs.writeFileSync(CONNECTIONS_FILE, JSON.stringify(connections, null, 2), 'utf-8');
}

// ========== MAC 地址反查 ==========

/** 获取所有连接的端口信息（备用） */
function getMacByIP(ip) {
    try {
        // 判断平台
        const isWin = process.platform === 'win32';
        let output;
        if (isWin) {
            output = execSync('arp -a', { timeout: 3000, encoding: 'utf-8' });
        } else {
            output = execSync('ip neigh show', { timeout: 3000, encoding: 'utf-8' });
        }

        const lines = output.split('\n');
        for (const line of lines) {
            // Windows: "192.168.1.1    00-11-22-33-44-55    动态"
            // Linux:   "192.168.1.1 dev eth0 lladdr 00:11:22:33:44:55 REACHABLE"
            if (line.includes(ip)) {
                // 提取 MAC 地址
                const macMatch = line.match(
                    /([0-9A-Fa-f]{2}[-:][0-9A-Fa-f]{2}[-:][0-9A-Fa-f]{2}[-:][0-9A-Fa-f]{2}[-:][0-9A-Fa-f]{2}[-:][0-9A-Fa-f]{2})/
                );
                if (macMatch) {
                    return macMatch[1].replace(/-/g, ':').toUpperCase();
                }
            }
        }
    } catch (e) {
        // ARP 命令可能无权限或超时，静默失败
    }
    return '00:00:00:00:00:00'; // 无法获取则返回空 MAC
}

// ========== 规则匹配 ==========

/**
 * 检查 IP 是否匹配规则
 * @param {string} ip - 客户端 IP
 * @param {string} mode - 'blacklist' 或 'whitelist'
 * @param {Array} rules - 规则列表
 * @returns {{ matched: boolean, action: string|null, rule: object|null }}
 */
function matchRule(ip, mode, rules) {
    // 按优先级排序（block 优先于 allow）
    const sorted = [...rules].sort((a, b) => {
        if (a.action === 'block' && b.action !== 'block') return -1;
        if (a.action !== 'block' && b.action === 'block') return 1;
        return 0;
    });

    for (const rule of sorted) {
        if (rule.ip === ip) {
            return { matched: true, action: rule.action, rule };
        }
        // 支持通配符: 192.168.1.*
        if (rule.ip && rule.ip.includes('*')) {
            const pattern = rule.ip.replace(/\./g, '\\.').replace(/\*/g, '.*');
            const regex = new RegExp(`^${pattern}$`);
            if (regex.test(ip)) {
                return { matched: true, action: rule.action, rule };
            }
        }
        // 支持 CIDR: 192.168.1.0/24
        if (rule.ip && rule.ip.includes('/')) {
            if (ipInCIDR(ip, rule.ip)) {
                return { matched: true, action: rule.action, rule };
            }
        }
    }

    return { matched: false, action: null, rule: null };
}

/** CIDR 匹配辅助函数 */
function ipInCIDR(ip, cidr) {
    try {
        const [rangeIp, bitsStr] = cidr.split('/');
        const bits = parseInt(bitsStr, 10);
        if (isNaN(bits) || bits < 0 || bits > 32) return false;

        const ipNum = ipToInt(ip);
        const rangeNum = ipToInt(rangeIp);
        if (ipNum === null || rangeNum === null) return false;

        const mask = bits === 0 ? 0 : ~(2 ** (32 - bits) - 1);
        return (ipNum & mask) === (rangeNum & mask);
    } catch {
        return false;
    }
}

function ipToInt(ip) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return null;
    return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

// ========== 中间件 ==========

/** 创建 WAF 中间件 */
function createWafMiddleware() {
    // 定时清理旧连接日志
    setInterval(() => {
        cleanupConnections();
    }, CLEANUP_INTERVAL);

    return function wafMiddleware(req, res, next) {
        // 跳过 WAF API 路径，防止自己拦截自己
        if (req.path.startsWith('/api/waf/') || req.path === '/waf.html' ||
            req.path.startsWith('/css/waf.css') || req.path.startsWith('/js/waf_admin.js')) {
            return next();
        }

        // 1. 提取客户端 IP
        const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
        // 处理 IPv6 映射的 IPv4 地址 (::ffff:192.168.1.1)
        const cleanIP = clientIP ? clientIP.replace(/^::ffff:/, '') : 'unknown';

        // 2. 非阻塞式获取 MAC（在请求处理结束后异步获取，避免阻塞）
        let mac = '查询中...';

        // 3. 读取规则
        const { mode, rules } = loadRules();

        // 4. 规则匹配
        const match = matchRule(cleanIP, mode, rules);

        let action = 'allow';
        let ruleInfo = null;

        if (match.matched) {
            if (mode === 'blacklist') {
                // 黑名单模式：命中 block 则拦截，命中 allow 则放行
                if (match.action === 'block') {
                    action = 'blocked';
                    ruleInfo = match.rule;
                } else {
                    action = 'allow';
                }
            } else if (mode === 'whitelist') {
                // 白名单模式：命中 allow 则放行，命中 block 则拦截
                if (match.action === 'allow') {
                    action = 'allow';
                } else {
                    action = 'blocked';
                    ruleInfo = match.rule;
                }
            }
        } else {
            // 没有匹配到规则
            if (mode === 'whitelist') {
                // 白名单模式：未匹配则默认拦截
                action = 'blocked';
            }
            // 黑名单模式：未匹配则默认放行
        }

        // 5. 异步获取 MAC 并记录日志
        setImmediate(() => {
            const macAddr = getMacByIP(cleanIP);
            const connectionLog = {
                timestamp: new Date().toISOString(),
                ip: cleanIP,
                mac: macAddr,
                method: req.method,
                url: req.originalUrl || req.url,
                userAgent: (req.headers['user-agent'] || '').substring(0, 120),
                action: action
            };

            try {
                const connections = loadConnections();
                connections.push(connectionLog);
                saveConnections(connections);
            } catch (e) {
                // 日志写入失败不影响主流程
            }
        });

        // 6. 如果被拦截，返回 403
        if (action === 'blocked') {
            // 为请求也尽量获取 MAC
            const macAddr = getMacByIP(cleanIP);
            res.status(403).json({
                code: 403,
                message: '您的请求已被 WAF 防火墙拦截',
                ip: cleanIP,
                mac: macAddr,
                reason: ruleInfo ? `匹配规则: ${ruleInfo.comment || ruleInfo.ip}` : '不在白名单中'
            });
            return;
        }

        // 7. 正常放行
        next();
    };
}

// ========== 连接日志清理 ==========
function cleanupConnections() {
    try {
        const connections = loadConnections();
        if (connections.length > MAX_LOG_ENTRIES) {
            saveConnections(connections.slice(-MAX_LOG_ENTRIES));
        }
    } catch (e) {
        // 静默
    }
}

// ========== WAF 管理 API ==========

class WafManager {
    /** 获取连接日志 */
    static getConnections(page = 1, pageSize = 50) {
        const connections = loadConnections();
        const total = connections.length;
        const start = (page - 1) * pageSize;
        const items = connections.slice(start, start + pageSize).reverse();
        return { total, page, pageSize, items };
    }

    /** 清空连接日志 */
    static clearConnections() {
        saveConnections([]);
        return true;
    }

    /** 获取规则列表 */
    static getRules() {
        return loadRules();
    }

    /** 添加/更新规则 */
    static upsertRule({ ip, type, action, comment }) {
        if (!ip || !action) {
            throw new Error('IP 和动作（block/allow）为必填项');
        }
        if (!['block', 'allow'].includes(action)) {
            throw new Error('动作必须是 block 或 allow');
        }

        const data = loadRules();
        const existing = data.rules.findIndex(r => r.ip === ip);
        const rule = {
            ip,
            type: type || 'exact',
            action,
            comment: comment || '',
            createdAt: new Date().toISOString()
        };

        if (existing >= 0) {
            // 更新
            rule.createdAt = data.rules[existing].createdAt;
            rule.updatedAt = new Date().toISOString();
            data.rules[existing] = rule;
        } else {
            // 新增
            data.rules.push(rule);
        }

        saveRules(data);
        return rule;
    }

    /** 删除规则 */
    static deleteRule(ip) {
        const data = loadRules();
        const idx = data.rules.findIndex(r => r.ip === ip);
        if (idx === -1) {
            throw new Error(`未找到 IP ${ip} 的规则`);
        }
        data.rules.splice(idx, 1);
        saveRules(data);
        return true;
    }

    /** 获取当前模式 */
    static getMode() {
        const data = loadRules();
        return data.mode;
    }

    /** 切换模式 */
    static setMode(mode) {
        if (!['blacklist', 'whitelist'].includes(mode)) {
            throw new Error('模式必须是 blacklist 或 whitelist');
        }
        const data = loadRules();
        data.mode = mode;
        saveRules(data);
        return mode;
    }

    /** 获取统计数据 */
    static getStats() {
        const connections = loadConnections();
        const total = connections.length;
        const blocked = connections.filter(c => c.action === 'blocked').length;
        const allowed = total - blocked;

        // 获取当前在线 IP（最近5分钟内有请求的）
        const fiveMinAgo = Date.now() - 5 * 60 * 1000;
        const recentIPs = new Set();
        for (const c of connections) {
            const t = new Date(c.timestamp).getTime();
            if (t >= fiveMinAgo) {
                recentIPs.add(c.ip);
            }
        }

        return {
            totalRequests: total,
            blockedRequests: blocked,
            allowedRequests: allowed,
            onlineIPs: recentIPs.size,
            blockRate: total > 0 ? ((blocked / total) * 100).toFixed(1) : '0.0'
        };
    }
}

module.exports = {
    createWafMiddleware,
    WafManager
};
