const log = console.log;

const pool = (function() {
  const mysql = require('mysql');
  const inpool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'work',
    password: 'wezl69!',
    database: 'tagsdb'
  });
  return inpool;
})();


const query = function query(queryString, onComplete, onError) {
  
  let handleError = (reject, message, err) => {
    log(`>> ${Date.now()}: ${message}: ${err.message}`);
    if (onError instanceof Function) {
      onError(err);
    }
    reject(err);
  };

  return new Promise((resolve, reject) => {
    handleError = handleError.bind(null, reject);
    pool.getConnection(function(err, connection) {
      if (err) {
        handleError('Pool failed to get connection.', err);
        return;
      }
      connection.query(queryString, function (err, results, fields) {
        connection.release();
        if (err) {
          handleError('Query failed', err);
          return;
        }
        if (onComplete instanceof Function) {
          onComplete(results, fields);
        }
        resolve(results, fields);
      });
    });
  }); 
};

module.exports.pool = pool;
module.exports.query = query;

