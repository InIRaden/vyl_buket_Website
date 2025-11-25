const { sequelize } = require("../lib/sequelize");
const Bouquet = require("./Bouquet");
const Order = require("./Order");
const OrderLog = require("./OrderLog");
const OrderImage = require("./OrderImage");
const Admin = require("./Admin");
const Setting = require("./Setting");

// Define associations
Order.belongsTo(Bouquet, { foreignKey: "bouquet_id", as: "bouquet" });
Bouquet.hasMany(Order, { foreignKey: "bouquet_id", as: "orders" });

OrderLog.belongsTo(Order, { foreignKey: "order_id", as: "order" });
Order.hasMany(OrderLog, { foreignKey: "order_id", as: "logs" });

OrderLog.belongsTo(Admin, { foreignKey: "admin_id", as: "admin" });
Admin.hasMany(OrderLog, { foreignKey: "admin_id", as: "logs" });

OrderImage.belongsTo(Order, { foreignKey: "order_id", as: "order" });
Order.hasMany(OrderImage, { foreignKey: "order_id", as: "images" });

// Sync models (hanya untuk development)
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: false }); // Set alter: true untuk update schema otomatis
    console.log("✅ All models synchronized");
  } catch (error) {
    console.error("❌ Error syncing models:", error.message);
  }
};

// Uncomment baris dibawah untuk sync otomatis saat server start
// syncDatabase();

module.exports = {
  sequelize,
  Bouquet,
  Order,
  OrderLog,
  OrderImage,
  Admin,
  Setting,
  syncDatabase,
};
