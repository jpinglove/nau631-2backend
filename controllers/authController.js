const { User } = require('../config/db');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize'); // 引入数据库操作对象

// 参考JWT例子
// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};


// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userExists = await User.findOne({
      where: {
        [Op.or]: [{ email: email }, { username: username }]
      }
    });

    if (userExists) {
      return res.status(400).json({ message: '用户已存在 (邮箱或用户名重复)' });
    }

    const user = await User.create({
      username,
      email,
      password, // 密码会经过HASH处理
    });

    if (user) {
      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        token: generateToken(user.id),
        message: '注册成功！'
      });
    } else {
      res.status(400).json({ message: '无效的用户数据导致注册失败' });
    }
  } catch (error) {
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const messages = error.errors.map(e => e.message); 
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器内部错误，注册失败', error: error.message });
  }
};

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  const { emailOrUsername, password } = req.body;

  try {
    const user = await User.scope('withPassword').findOne({
      where: {
        [Op.or]: [{ email: emailOrUsername }, { username: emailOrUsername }]
      }
    });

    if (user && (await user.matchPassword(password))) {
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        token: generateToken(user.id),
        message: '登录成功！'
      });
    } else {
      res.status(401).json({ message: '用户名或密码错误' });
    }
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器内部错误，登录失败', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  if (req.user) {
    res.json({
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
    });
  } else {
    res.status(404).json({ message: '未找到用户信息' });
  }
};

// @desc    Password Reset
// @route   PUT /api/auth/resetpassword
// @access  Private
exports.resetPassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: '请输入旧密码和新密码' });
    }

    if (newPassword.length < 3) {
      return res.status(400).json({ message: '新密码长度至少为3个字符' });
    }

    try {
        const user = await User.scope('withPassword').findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ message: '未找到用户' });
        }

        const isMatch = await user.matchPassword(oldPassword);

        if (!isMatch) {
            return res.status(401).json({ message: '旧密码不正确' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: '密码更新成功' });

    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        console.error('重置密码错误:', error);
        res.status(500).json({ message: '服务器内部错误，密码更新失败' });
    }
};

