require("dotenv").config();

const mysql = require("mysql");

const rawDatabase = mysql.createPool({
  host: process.env.DATABASE_IP,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_RAW,
})
module.exports.rawDatabase = rawDatabase


const treatedDatabase = mysql.createPool({
  host: process.env.DATABASE_IP,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_TREATED,
})
module.exports.treatedDatabase = treatedDatabase
