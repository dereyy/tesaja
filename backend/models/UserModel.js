const { Sequelize, DataTypes } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config();

// Membuat koneksi ke database
const sequelize = new Sequelize(
  process.env.DB_NAME, // nama database
  process.env.DB_USERNAME, // username database
  process.env.DB_PASSWORD, // password database
  {
    host: process.env.DB_HOST, // host database
    dialect: "mysql", // jenis database
  }
);

// Mendefinisikan model User
const User = sequelize.define(
  "User",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    refresh_token: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "user", // pastikan nama tabel sesuai
    timestamps: true, // akan otomatis menambah `createdAt` dan `updatedAt`
  }
);

// Menggunakan sequelize.sync() untuk menyinkronkan model dengan database
const syncDatabase = async () => {
  try {
    await sequelize.authenticate(); // memverifikasi koneksi
    console.log("Database connected successfully.");
    // Sync tabel (akan membuat tabel jika belum ada)
    await sequelize.sync({ force: false }); // `force: false` agar tidak menghapus tabel yang sudah ada
    console.log("Tabel berhasil disinkronkan.");
  } catch (err) {
    console.error("Error syncing the database:", err);
  }
};

syncDatabase(); // panggil fungsi untuk sinkronisasi

module.exports = User; // ekspor model User
