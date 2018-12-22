module.exports = (function() {

  const {assert} = require('chai');
  const {pool, query, DBConnError} = require('../../../app/data/dbconnection');
  const QueryBuilder = require('../../../app/data/querybuilder');

  describe('DatabaseConnection', function() {
    describe('::pool', function() {
      it ('should have a connection to the database', function() {
        pool.getConnection((err, conn) => {
          assert.isNull(err);
          assert.isNotNull(conn);
        });
      });
    });

    describe('::query', function() {
      it ('should asynchronously insert data', function(done) {
        const qb = new QueryBuilder();
        qb.insert('user').columns(['name', 'email']).values(['adam', 'adam@atricoware']);
        query(qb.buildQuery())
        .then((results, fields) => {
          console.log(results);
          console.log(fields);
          done();
        })
        .catch(err => {
          assert.equal(err.code, 'ER_DUP_ENTRY');
          done();
        });
      });

      it ('should asynchronously retrieve data', function(done) {
        const qb = new QueryBuilder();
        qb.select().from('user');
        query(qb.buildQuery())
          .then((results, fields) => {
            console.log(results);
            console.log(fields);
            done();
          })
          .catch(err => {
            assert.fail();
            done();
          });
      });
    });
  });

})();