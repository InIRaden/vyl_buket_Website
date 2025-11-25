const { DataTypes } = require("sequelize");
const { sequelize } = require("../lib/sequelize");

const Setting = sequelize.define(
  "Setting",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "settings",
    timestamps: true,
    createdAt: false,
    updatedAt: "updated_at",
  }
);

module.exports = Setting;
