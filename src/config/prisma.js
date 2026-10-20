//Cấu hình Prisma Client để kết nối cơ sở dữ liệu
var { PrismaClient } = require("../generated/prisma");

var prisma = new PrismaClient();

module.exports = prisma;
