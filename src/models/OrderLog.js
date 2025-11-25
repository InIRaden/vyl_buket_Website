const { DataTypes } = require("sequelize");
const { sequelize } = require("../lib/sequelize");

const OrderLog = sequelize.define(
  "OrderLog",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "orders",
        key: "id",
      },
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "admins",
        key: "id",
      },
    },
    previous_status: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    new_status: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "order_logs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = OrderLog;
