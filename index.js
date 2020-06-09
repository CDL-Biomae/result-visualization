require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");

const api = express();
api
  .use(cors())
  .use(express.json())
  .use("/api", require("./routes"))
  .use(express.static("./dist"))
  .use("*", (req, res) => res.sendFile("index.html", { root: "./dist" }));

const server = http.createServer(api);

server.listen(process.env.PORT || 3000);
console.log(`API Listenning on port 3000`);
