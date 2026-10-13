require("dotenv").config();
var orderRoutes = require("./routes/orderRoutes");
var express = require("express");
var prisma = require("./config/prisma");
var productRoutes = require("./routes/productRoutes");
var authRoutes = require("./routes/authRoutes");
var app = express();

app.use(express.json());

// API kiem tra tinh trang server
app.get("/health", function (req, res) {
  res.status(200).json({
    status: "OK",
    message: "MVP API dang hoat dong",
  });
});

// API kiem tra ket noi PostgreSQL
app.get("/health/db", async function (req, res) {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "OK",
      message: "Ket noi PostgreSQL thanh cong",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "ERROR",
      message: "Khong the ket noi PostgreSQL",
    });
  }
});

// API san pham
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
// Khoi dong server
var PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
  console.log("Server dang chay tai port " + PORT);
});
