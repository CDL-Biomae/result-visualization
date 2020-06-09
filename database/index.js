require("dotenv").config();

const mysql = require("mysql");

const rawDatabase = mysql.createConnection({
  host: process.env.DATABASE_IP,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_RAW,
})
rawDatabase.connect()
module.exports.rawDatabase = rawDatabase


const treatedDatabase = mysql.createConnection({
  host: process.env.DATABASE_IP,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_TREATED,
})
treatedDatabase.connect()
module.exports.treatedDatabase = treatedDatabase
