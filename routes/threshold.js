const { Router } = require("express");

const { threshold } = require.main.require("./resources");

module.exports = new Router()
  .get("/toxicity", (req, res, next) => {
    threshold.getToxicity(req, (result) => {
      res.json(result);
    });
  })
  .get("/chemistry", (req, res, next) => {
    threshold.getChemistry(req, (result) => {
      res.json(result);
    });
  })
