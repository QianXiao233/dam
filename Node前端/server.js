const express = require('express');
const app = express();
const PORT = 3000;

// 静态文件
app.use(express.static('public'));
app.use(express.static('public/html'))

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅智御安澜平台已上线 端口号：${PORT}`);
});