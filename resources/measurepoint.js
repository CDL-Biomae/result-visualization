const { rawDatabase } = require.main.require("./database");

module.exports.getOneWithChemistryResult = ({ query }, callback) => {
  if (query.id) {
    rawDatabase.getConnection((err, rawDatabaseConnection) => {
      if(err) throw err
      rawDatabaseConnection.connect(() => {

        rawDatabaseConnection.query(
          `SELECT sandre,prefix, value  FROM Analysis JOIN Pack ON Pack.id=Analysis.pack_id JOIN Measurepoint ON Measurepoint.id=Pack.measurepoint_id WHERE Measurepoint.id=${query.id}`,
          (err, result) => {
            if (err) throw err;
            let output = {}
            result.forEach( row => {
              if(row.prefix) output[row.sandre] = -1
              else output[row.sandre] = row.value
            })
            rawDatabaseConnection.release()
            return callback(output);
          }
        );
      })
    })
  } else {
    return callback(null);
  }
};