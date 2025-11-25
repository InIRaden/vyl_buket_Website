const { DataTypes } = require("sequelize");
const { sequelize } = require("../lib/sequelize");

const OrderImage = sequelize.define(
  "OrderImage",
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
      onDelete: "CASCADE",
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    image_type: {
      type: DataTypes.ENUM("DESIRED_BOUQUET", "REFERENCE", "PAYMENT_PROOF"),
      allowNull: false,
      comment: "DESIRED_BOUQUET = foto buket yang diinginkan, REFERENCE = foto referensi buket, PAYMENT_PROOF = bukti transfer",
    },
    display_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Urutan tampilan foto",
    },
  },
  {
    tableName: "order_images",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = OrderImage;
