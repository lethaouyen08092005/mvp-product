var express = require("express");
var router = express.Router();
var prisma = require("../config/prisma");

// API lấy danh sách sản phẩm
router.get("/", async function (req, res) {
  try {
    var products = await prisma.product.findMany();

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Loi khi lay danh sach san pham",
    });
  }
});

// API lấy chi tiết một sản phẩm theo ID
router.get("/:id", async function (req, res) {
  try {
    var id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "ID san pham khong hop le",
      });
    }

    var product = await prisma.product.findUnique({
      where: {
        pid: id,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay san pham",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Loi khi lay chi tiet san pham",
    });
  }
});

module.exports = router;
// API xóa sản phẩm theo ID
router.delete("/:id", async function (req, res) {
  try {
    var id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "ID san pham khong hop le",
      });
    }

    // Kiem tra san pham co ton tai khong
    var product = await prisma.product.findUnique({
      where: {
        pid: id,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay san pham",
      });
    }

    // Xoa san pham
    await prisma.product.delete({
      where: {
        pid: id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Xoa san pham thanh cong",
      data: product,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Loi khi xoa san pham",
    });
  }
});
