const mysql = require('mysql2/promise');

// 创建连接池（记得改成你自己的数据库信息）
const pool = mysql.createPool({
    host: 'localhost',      // 数据库地址
    user: 'root',           // 用户名
    password: '126525',    // 密码
    database: 'dam', // 数据库名
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;