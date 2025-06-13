
// nau 632-1 高阶 学生纪平
// 参考网上的数据库连接配置
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config(); // Ensure .env variables are loaded

// Initialize Sequelize with the database connection string
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false, // Log SQL queries in development
  dialectOptions: {
    // Railway (and some other cloud providers) might require SSL
    // If you encounter connection issues, uncomment and adjust this:
    ssl: {
      require: true,
      rejectUnauthorized: false // This might be needed for self-signed certificates or specific cloud provider setups
    }
  }
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require('../models/User')(sequelize, Sequelize.DataTypes);
db.Item = require('../models/Item')(sequelize, Sequelize.DataTypes);

// Define associations
// A User can have many Items
db.User.hasMany(db.Item, {
  foreignKey: {
    name: 'userId', // This will create a userId column in the Items table
    allowNull: false
  },
  onDelete: 'CASCADE', // If a user is deleted, their items are also deleted
  as: 'items' // Alias for when you include items with a user
});

// An Item belongs to a User
db.Item.belongsTo(db.User, {
  foreignKey: {
    name: 'userId',
    allowNull: false
  },
  as: 'user' // Alias for when you include the user with an item
});


const connectDBAndSync = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL Connected Successfully.');

    // Sync all models with the database
    // { alter: true } will attempt to update tables to match model definitions
    // { force: true } will drop tables and recreate them (USE WITH CAUTION - DELETES DATA)
    // In production, you'd typically use migrations instead of sync.
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' }); // or just sequelize.sync()
    console.log('All models were synchronized successfully.');

  } catch (error) {
    console.error('Unable to connect to the database or sync models:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize, // Export the sequelize instance
  connectDBAndSync, // Export the connection and sync function
  User: db.User, // Export models directly for easier access in controllers
  Item: db.Item,
};