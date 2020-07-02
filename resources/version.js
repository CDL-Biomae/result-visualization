const { treatedDatabase } = require.main.require("./database");

module.exports.getAll = (callback) => {
  treatedDatabase.getConnection((err, connection) => {
    if(err) throw err
    connection.connect(() => {
      connection.query("SELECT * FROM version", (error, result) => {
        if (error) throw err;
        connection.release()
        return callback(result);
      });
    })
  })
};
