var express = require("express");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var prisma = require("../config/prisma");

var router = express.Router();

// API dang ky tai khoan
router.post("/register", async function (req, res) {
  try {
    var username = req.body.username;
    var fullname = req.body.fullname;
    var password = req.body.password;

    if (!username || !fullname || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui long nhap username, fullname va password",
      });
    }

    if (username.length > 50 || fullname.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Username toi da 50 ky tu, fullname toi da 100 ky tu",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mat khau phai co it nhat 6 ky tu",
      });
    }

    var existingUser = await prisma.user.findFirst({
      where: { username: username },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username da ton tai",
      });
    }

    var role = await prisma.role.findFirst({
      where: { rolename: "normal" },
    });

    var member = await prisma.memberShip.findFirst({
      where: { score: 10 },
    });

    if (!role || !member) {
      return res.status(500).json({
        success: false,
        message: "Chua co du lieu Role normal hoac MemberShip score 10",
      });
    }

    var hashedPassword = await bcrypt.hash(password, 10);

    var user = await prisma.user.create({
      data: {
        username: username,
        fullname: fullname,
        password: hashedPassword,
        roleid: role.roleid,
        mid: member.mid,
      },
      select: {
        uid: true,
        username: true,
        fullname: true,
        roleid: true,
        mid: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Dang ky tai khoan thanh cong",
      data: user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Loi khi dang ky tai khoan",
    });
  }
});

// API dang nhap va cap JWT Token
router.post("/login", async function (req, res) {
  try {
    var username = req.body.username;
    var password = req.body.password;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui long nhap username va password",
      });
    }

    var user = await prisma.user.findFirst({
      where: { username: username },
      include: { role: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Username hoac password khong dung",
      });
    }

    var passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Username hoac password khong dung",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Chua cau hinh JWT_SECRET",
      });
    }

    var token = jwt.sign(
      {
        uid: user.uid,
        username: user.username,
        roleid: user.roleid,
        rolename: user.role.rolename,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" },
    );

    return res.status(200).json({
      success: true,
      message: "Dang nhap thanh cong",
      token: token,
      data: {
        uid: user.uid,
        username: user.username,
        fullname: user.fullname,
        role: user.role.rolename,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Loi khi dang nhap",
    });
  }
});

module.exports = router;
