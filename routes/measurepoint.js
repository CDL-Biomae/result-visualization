const { Router } = require("express");

const { measurepoint } = require.main.require("./resources");

module.exports = new Router().get("/chemistry", (req, res, next) => {
  measurepoint.getOneWithChemistryResult(req, (result) => {
    res.json(result);
  });
});
