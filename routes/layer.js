const { Router } = require("express");

const { layer } = require.main.require("./resources");

module.exports = new Router()
  .get("/hydro-sector", (req, res, next) => {
    layer.getHydroSector((result) => {
      res.json(result);
    });
  })
  .get("/stream", (req, res, next) => {
    layer.getStream(req, (result) => {
      res.json(result);
    });
  });
