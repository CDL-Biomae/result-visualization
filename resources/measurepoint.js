const { rawDatabase } = require.main.require("./database");

module.exports.getOneWithChemistryResult = ({ query }, callback) => {
  if (query.id) {
    rawDatabase.query(
      `SELECT sandre,prefix, value  FROM Analysis JOIN Pack ON Pack.id=Analysis.pack_id JOIN Measurepoint ON Measurepoint.id=Pack.measurepoint_id WHERE Measurepoint.id=${query.id}`,
      (err, result) => {
        if (err) throw err;
        let output = {}
        result.forEach( row => {
          if(row.prefix) output[row.sandre] = -1
          else output[row.sandre] = row.value
        })
        return callback(output);
      }
    );
  } else {
    return callback(null);
  }
};