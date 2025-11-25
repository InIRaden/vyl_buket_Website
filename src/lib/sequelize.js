const { Sequelize } = require("sequelize");

// Database configuration dengan optimasi untuk cPanel
const sequelize = new Sequelize(
  process.env.DB_NAME || "vyl_buket_db",
  process.env.DB_USER || "root", 
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    dialect: process.env.DB_DIALECT || "mysql",
    
    // Connection pool (OPTIMASI UNTUK cPANEL!)
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || "3", 10), // Max 3 connections untuk hemat memory
      min: parseInt(process.env.DB_POOL_MIN || "0", 10),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || "30000", 10),
      idle: parseInt(process.env.DB_POOL_IDLE || "10000", 10),
    },
    
    // Logging (disable di production)
    logging: process.env.NODE_ENV === "production" ? false : console.log,
    
    // Timezone
    timezone: "+07:00",
    
    // Retry options
    retry: {
      max: 3,
      timeout: 3000,
    },
    
    // Define options
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true,
    },
    
    // Query options
    dialectOptions: {
      connectTimeout: 10000,
    },
  }
);

// Test koneksi dengan error handling
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");
    return true;
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    return false;
  }
};

// Auto-reconnect handlers
sequelize.beforeConnect(async () => {
  console.log("📡 Connecting to database...");
});

sequelize.afterConnect(() => {
  console.log("✅ Database connection established");
});

testConnection();

module.exports = { sequelize, testConnection };
