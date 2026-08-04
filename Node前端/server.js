const express = require('express');
const app = express();
const PORT = 3000;
const path = require('path');

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

// ======================== 大文件优化 ========================
// 1. 增加请求体大小限制
app.use(express.json({ limit: '1024mb' }));
app.use(express.urlencoded({ extended: true, limit: '1024mb' }));

// 2. 针对模型文件夹的特殊优化（修复路径匹配）
app.use('/model', (req, res, next) => {
  // 设置 CORS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Range, Content-Type');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
  
  // 支持断点续传
  res.header('Accept-Ranges', 'bytes');

  // 禁用强缓存（每次回源验证，文件更新立即生效）
  res.header('Cache-Control', 'no-cache');
  
  next();
});

// 3. 静态文件服务（模型文件夹）
app.use('/model', express.static(path.join(__dirname, 'public/model'), {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // 针对 GLB 文件设置特定头
    if (filePath.endsWith('.glb')) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', 'inline; filename="model.glb"');
      res.setHeader('Accept-Ranges', 'bytes');
    }
  }
}));

// 4. 其他静态文件
app.use(express.static('public', {
  // 禁用强缓存（每次回源验证）
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache');
  }
}));

app.use(express.static('public/html', {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache');
  }
}));
// ======================== 启动 ========================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅智御安澜平台已上线 端口号：${PORT}`);
    console.log(`🔒 WAF 管理 API: http://localhost:${PORT}/api/waf/stats`);
    console.log(`📋 WAF 管理页面: http://localhost:${PORT}/waf.html`);
    console.log(`📦 模型文件路径: ${path.join(__dirname, 'public/model')}`);
    console.log(`🌐 访问地址: http://localhost:${PORT}`);
});

// ======================== 错误处理 ========================
// 处理大文件传输中断
app.use((err, req, res, next) => {
  if (err.code === 'ECONNRESET') {
    console.warn('⚠️ 客户端连接中断（可能是大文件下载中断）');
    return;
  }
  console.error('❌ 服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 处理 404
app.use((req, res) => {
  console.log(`❓ 404: ${req.method} ${req.url}`);
  res.status(404).send('404 Not Found');
});