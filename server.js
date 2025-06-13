const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDBAndSync } = require('./config/db');

// 加载环境变量
dotenv.config();

// 连接数据库
connectDBAndSync();

const app = express();

// 中间件
app.use(cors()); // 启动跨域
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/items', require('./routes/itemRoutes'));

app.get('/', (req, res) => {
  res.send('API is running with PostgreSQL...');
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

