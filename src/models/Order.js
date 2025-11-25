const { DataTypes } = require("sequelize");
const { sequelize } = require("../lib/sequelize");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    order_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    bouquet_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "bouquets",
        key: "id",
      },
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    sender_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "Nama pengirim transfer/pembayaran",
    },
    sender_account_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Nomor rekening pengirim",
    },
    sender_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "Nomor WhatsApp/telepon pengirim untuk konfirmasi",
    },
    bouquet_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    payment_type: {
      type: DataTypes.ENUM("DP", "FULL"),
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Metode pembayaran yang dipilih (BCA, SeaBank, ShopeePay, dll)",
    },
    dp_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    remaining_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    total_paid: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    pickup_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    pickup_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    additional_request: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    card_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reference_image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: "DEPRECATED - gunakan tabel order_images",
    },
    payment_proof_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: "DEPRECATED - gunakan tabel order_images",
    },
    order_status: {
      type: DataTypes.ENUM(
        "WAITING_CONFIRMATION",
        "PAYMENT_CONFIRMED",
        "IN_PROCESS",
        "READY_FOR_PICKUP",
        "COMPLETED",
        "CANCELLED"
      ),
      defaultValue: "WAITING_CONFIRMATION",
    },
    payment_status: {
      type: DataTypes.ENUM("UNPAID", "PAID"),
      defaultValue: "UNPAID",
    },
    whatsapp_sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "orders",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Order;
