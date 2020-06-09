const { Router } = require("express");

const { version } = require.main.require("./resources");

module.exports = new Router()
  .get("/", (req, res, next) => {
    version.getAll((result) => {
      res.json(result);
    });
  })
