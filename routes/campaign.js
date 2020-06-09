const { Router } = require("express");

const { campaign } = require.main.require("./resources");

module.exports = new Router()
  .get("/", (req, res, next) => {
    campaign.getAll((result) => {
      res.json(result);
    });
  })
  .get("/data", (req, res, next) => {
    campaign.getAllWithToxResult(req, (result) => {
      res.json(result);
    });
  })
  .get("/chemistry", (req, res, next) => {
    campaign.getOneWithChemistryResult(req, (result) => {
      res.json(result);
    });
  });
