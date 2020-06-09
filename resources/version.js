const { treatedDatabase } = require.main.require("./database");

module.exports.getAll = (callback) => {
  treatedDatabase.query("SELECT * FROM version", (err, result) => {
    if (err) throw err;
    return callback(result);
  });
};
