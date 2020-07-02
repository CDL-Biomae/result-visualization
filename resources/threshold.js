const { treatedDatabase } = require.main.require("./database");

module.exports.getToxicity = (req, callback) => {
  treatedDatabase.getConnection((err, treatedDatabaseConnection) => {
    if (err) throw err;
    treatedDatabaseConnection.connect(() => {
      treatedDatabaseConnection.query(`SELECT * FROM r2_threshold WHERE version=${req.query.version}`, (err, result) => {
        if (err) throw err;
        treatedDatabaseConnection.release()
        return callback(result);
      });
    })
  })
};
module.exports.getChemistry = (req, callback) => {
  treatedDatabase.getConnection((err, treatedDatabaseConnection) => {
    if (err) throw err;
    treatedDatabaseConnection.connect(() => {
      treatedDatabaseConnection.query(`SELECT * FROM r3 WHERE version=${req.query.version}`, (err, result) => {
        if (err) throw err;
        treatedDatabaseConnection.release()
        return callback(result);
      });
    })
  })
};
