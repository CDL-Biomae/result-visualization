const { Router } = require("express");

module.exports = new Router()

    .use("/campaign", require("./campaign"))
    .use("/version", require("./version"))
    .use("/threshold", require("./threshold"))
    .use("/layer", require("./layer"))
    .use("/measurepoint", require("./measurepoint"))
    .use((err, req, res, next) => {
        console.log(err)
        res.status(500).json(err.message);
    });