const express = require('express');
const app = express();
const PORT = 3000;

// ======================== WAF 防火墙 ========================
const WAF = require('./waf');
const waf = new WAF({
  // whitelistMode: false,    // false=黑名单模式, true=白名单模式
  // arpTTL: 30000,           // ARP 缓存刷新间隔 30s
});

// WAF 中间件（检查所有请求）
app.use(waf.middleware());

// 解析 JSON 和 URL 编码请求体（WAF API 需要）
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// WAF API 路由（挂载在 /api/waf 下）
app.use('/api/waf', waf.createRouter());

// ======================== 静态文件服务 ========================
app.use(express.static('public'));
app.use(express.static('public/html'))

// ======================== 启动 ========================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅智御安澜平台已上线 端口号：${PORT}`);
    console.log(`🔒 WAF 管理 API: http://localhost:${PORT}/api/waf/stats`);
    console.log(`📋 WAF 管理页面: http://localhost:${PORT}/waf.html`);
});