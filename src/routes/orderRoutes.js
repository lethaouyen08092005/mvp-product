var express = require("express");
var prisma = require("../config/prisma");
var authMiddleware = require("../middleware/authMiddleware");

var router = express.Router();

// API tao don hang
router.post("/", authMiddleware, async function (req, res) {
  try {
    var items = req.body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Don hang phai co it nhat mot san pham",
      });
    }

    var seen = {};

    for (var i = 0; i < items.length; i++) {
      var pid = Number(items[i].pid);
      var qty = Number(items[i].qty);

      if (
        !Number.isInteger(pid) ||
        pid <= 0 ||
        !Number.isInteger(qty) ||
        qty <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Ma san pham va so luong phai la so nguyen duong",
        });
      }

      if (seen[pid]) {
        return res.status(400).json({
          success: false,
          message: "Khong duoc lap lai san pham trong don hang",
        });
      }

      seen[pid] = true;
    }

    var order = await prisma.$transaction(async function (tx) {
      var details = [];
      var checkedItems = [];

      for (var i = 0; i < items.length; i++) {
        var pid = Number(items[i].pid);
        var qty = Number(items[i].qty);

        var product = await tx.product.findUnique({
          where: { pid: pid },
        });

        if (!product) {
          var notFound = new Error("Khong tim thay san pham ID " + pid);
          notFound.status = 404;
          throw notFound;
        }

        if (product.quantity < qty) {
          var insufficient = new Error(
            "San pham " + product.pname + " khong du so luong",
          );
          insufficient.status = 400;
          throw insufficient;
        }

        details.push({
          qty: qty,
          unit_price: product.price,
          product: {
            connect: { pid: pid },
          },
        });

        checkedItems.push({
          pid: pid,
          qty: qty,
        });
      }

      var createdOrder = await tx.order.create({
        data: {
          uid: req.user.uid,
          createat: new Date(),
          details: {
            create: details,
          },
        },
        include: {
          details: {
            include: {
              product: true,
            },
          },
        },
      });

      for (var i = 0; i < checkedItems.length; i++) {
        await tx.product.update({
          where: { pid: checkedItems[i].pid },
          data: {
            quantity: {
              decrement: checkedItems[i].qty,
            },
          },
        });
      }

      return createdOrder;
    });

    return res.status(201).json({
      success: true,
      message: "Dat hang thanh cong",
      data: order,
    });
  } catch (error) {
    console.error(error);

    return res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : "Loi khi tao don hang",
    });
  }
});

// API xem chi tiet don hang cua tai khoan dang dang nhap
router.get("/:id", authMiddleware, async function (req, res) {
  try {
    var oid = Number(req.params.id);

    if (!Number.isInteger(oid) || oid <= 0) {
      return res.status(400).json({
        success: false,
        message: "Ma don hang khong hop le",
      });
    }

    var order = await prisma.order.findFirst({
      where: {
        oid: oid,
        uid: req.user.uid,
      },
      include: {
        details: {
          include: {
            product: true,
          },
        },
        shipments: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay don hang",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Loi khi xem chi tiet don hang",
    });
  }
});

// API tao thong tin giao hang cho don hang
router.post("/:id/shipment", authMiddleware, async function (req, res) {
  try {
    var oid = Number(req.params.id);

    if (!Number.isInteger(oid) || oid <= 0) {
      return res.status(400).json({
        success: false,
        message: "Ma don hang khong hop le",
      });
    }

    var order = await prisma.order.findFirst({
      where: {
        oid: oid,
        uid: req.user.uid,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay don hang",
      });
    }

    var shipment = await prisma.shipment.create({
      data: {
        oid: oid,
        status: "Cho xu ly",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Tao thong tin giao hang thanh cong",
      data: shipment,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Loi khi tao thong tin giao hang",
    });
  }
});

module.exports = router;

// API xem danh sach don hang cua tai khoan dang dang nhap
router.get("/", authMiddleware, async function (req, res) {
  try {
    var orders = await prisma.order.findMany({
      where: {
        uid: req.user.uid,
      },
      include: {
        details: {
          include: {
            product: true,
          },
        },
        shipments: true,
      },
      orderBy: {
        oid: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Loi khi lay danh sach don hang",
    });
  }
});
