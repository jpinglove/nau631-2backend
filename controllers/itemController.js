const { Item, User } = require('../config/db');

// @desc    Get all items for logged in user
// @route   GET /api/items
// @access  Private
exports.getItems = async (req, res) => {
  try {
    const items = await Item.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(items);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('服务器错误，获取物品列表失败');
  }
};

// @desc    Create an item
// @route   POST /api/items
// @access  Private
exports.createItem = async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    return res.status(400).json({ message: '物品名称和描述不能为空' });
  }

  try {
    const newItem = await Item.create({
      name,
      description,
      userId: req.user.id,
    });
    res.status(201).json(newItem);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => `${e.path} 字段验证失败: ${e.message}`);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error(error.message);
    res.status(500).send('服务器错误，创建物品失败');
  }
};

// @desc    Get single item
// @route   GET /api/items/:id
// @access  Private
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ message: '未找到指定的物品' });
    }
    if (item.userId !== req.user.id) {
      return res.status(401).json({ message: '无权访问此物品' });
    }

    res.json(item);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('服务器错误');
  }
};

// @desc    Update an item
// @route   PUT /api/items/:id
// @access  Private
exports.updateItem = async (req, res) => {
  const { name, description } = req.body;

  try {
    let item = await Item.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ message: '未找到要更新的物品' });
    }

    // 确保用户拥用该物品权限
    if (item.userId !== req.user.id) {
      return res.status(401).json({ message: '无权修改此物品' });
    }

    // 更新字段
    item.name = name || item.name;
    item.description = description || item.description;

    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => `${e.path} 字段验证失败: ${e.message}`);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error(error.message);
    res.status(500).send('服务器错误');
  }
};

// @desc    Delete an item
// @route   DELETE /api/items/:id
// @access  Private
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ message: '未找到要删除的物品' });
    }

    // 确保用户拥用该物品权限
    if (item.userId !== req.user.id) {
      return res.status(401).json({ message: '无权删除此物品' });
    }

    await item.destroy();

    res.json({ message: '物品已成功删除' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('服务器错误');
  }
};

