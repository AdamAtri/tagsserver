module.exports = (function() {
  const {assert, expect} = require('chai'); 
  const QueryBuilder = require('../../../app/data/querybuilder');
  
  let qb; 
  

  describe('QueryBuilder - SELECT', function() {
    beforeEach(() => {
      qb = new QueryBuilder();
    });  

    describe('# select', function() {
      it ('should set the current query objects function type to "select"', function() {
        const obj = qb.select();
        assert.isNotNull(obj, 'The current object is empty');
        assert.equal(obj.current.function, 'select');
      });
    });

    describe('# from', function() {
      it ('should throw a Reference Error if the current object has not had its function set', function() {
        expect(qb.from.bind(qb, qb.current, 'table-name')).to.throw(ReferenceError);
      });
      it ('should chain with master functions like select', function() {
        const obj = qb.select().from('sometable').current;
        assert.equal(obj.function, 'select');
        assert.equal(obj.tableAccess, 'from');
        assert.equal(obj.table, 'sometable');
      });
    });

    describe('# distinct', function() {
      it ('should add a "DISTINCT" flag if called after a master function like select', function() {
        const obj = qb.select().distinct().from('sometable').current;
        assert.isTrue(obj.distinct);
      });
    });

    describe('# where', function() {
      it ('should set the current modifier to "where"', function() {
        qb.select().from('sometable').where('id > 2');
        assert.isTrue(qb.currentModifier == 'where');
      });
      it ('should append conditions to the "where" array', function() {
        const obj = qb.select().from('sometable').where('id > 2').current;
        assert.isTrue(obj.where && obj.where.length === 1);
      });
    });

    describe('# and', function() {
      it ('should append a condition to the currentModifier array', function() {
        const obj = qb.select().from('sometable').where('id > 2').and('name in ("dummy", "charleton")').current;
        assert.isTrue(obj.where && obj.where.length === 2);
      });
    });

    describe('# buildQuery (buildSelect)', function() {
      it ('should return a SELECT query when that was the master function', function() {
        qb.select().from('sometable');
        let expected = 'SELECT * from sometable;';
        let actual = qb.buildQuery();
        assert.equal(expected, actual, `Expected "${expected}" to equal "${actual}"`);
      });
      it ('.. with distinct', function() {
        qb.select().distinct().from('sometable');
        expected = 'SELECT DISTINCT * from sometable;';
        actual = qb.buildQuery();
        assert.equal(expected, actual, `Expected "${expected}" to equal "${actual}"`);
      });
      it ('.. with columns', function() {
        qb.select(['id', 'name']).distinct().from('sometable');
        expected = 'SELECT DISTINCT id, name from sometable;';
        actual = qb.buildQuery();
        assert.equal(expected, actual, `Expected "${expected}" to equal "${actual}"`);
      });
      it ('.. with a "where" clause', function() {
        qb.select(['id', 'name']).distinct().from('sometable').where('id == "one"');
        expected = 'SELECT DISTINCT id, name from sometable where id == "one";';
        actual = qb.buildQuery();
        assert.equal(expected, actual, `Expected "${expected}" to equal "${actual}"`);
      });
      it ('.. with "and" clauses appended to "where"', function() {
        qb.select(['id', 'name']).distinct()
          .from('sometable').where('id == "one"')
          .and('name === "adam"');
        expected = 'SELECT DISTINCT id, name from sometable where id == "one" and name === "adam";';
        actual = qb.buildQuery();
        assert.equal(expected, actual, `Expected "${expected}" to equal "${actual}"`);
      });
    });
  });

  describe('QueryBuilder - INSERT', function() {
    beforeEach(() => {
      qb = new QueryBuilder();
    });  

    describe('# insert', function() {
      it ('should set the current query objects function type to "insert"', function() {
        const obj = qb.insert('sometable');
        assert.isNotNull(obj, 'The current query object is empty');
        assert.equal(obj.current.function, 'insert');
        assert.equal(obj.current.table, 'sometable');
        assert.equal(obj.current.tableAccess, 'into');
      });
    });

    describe('# columns', function() {
      it ('should update the columns list with a single item', function() {
        const obj = qb.insert('sometable').columns('id').current;
        assert.isTrue(obj.columns instanceof Array);
        assert.equal(obj.columns.length, 1);
        assert.equal(obj.columns[0], 'id');
      });
      it ('should update the columns list with an array of items', function() {
        const columns = ['one', 'two', 'three'];
        let obj = qb.insert('sometable').columns(columns).current;
        assert.isTrue(obj.columns instanceof Array);
        assert.equal(obj.columns.length, 3);
        assert.isTrue(obj.columns.every(col => columns.indexOf(col) > -1)); 

        obj = qb.columns('four').current;
        assert.equal(obj.columns.length, 4);
        assert.equal(obj.columns[3], 'four');
      });
    });

    describe('# values', function() {
      it ('should throw an error if number of values does not equal number of columns', function() {
        expect(qb.insert('sometable').values.bind(qb, 'newValue')).to.throw(RangeError);
      });
      it ('should update the values list with a single item', function() {
        const obj = qb.insert('sometable').columns('id').values('myid').current;
        assert.isTrue(obj.values instanceof Array);
        assert.equal(obj.values.length, 1);
        assert.equal(obj.values[0], '"myid"');
      });
      it ('should update the values list with an array of items', function() {
        const columns = ['one', 'two', 'three'];
        const values = [1, 2, 3];
        let obj = qb.insert('sometable').columns(columns).values(values).current;
        assert.isTrue(obj.values instanceof Array);
        assert.equal(obj.values.length, 3);
        assert.isTrue(obj.values.every(val => values.indexOf(val) > -1)); 

        obj = qb.columns('four').values(5).current;
        assert.equal(obj.values.length, 4);
        assert.equal(obj.values[3], 5);
      });
    });

    describe('# buildQuery (buildInsert)', function() {
      const columns = ['one', 'two', 'three'];
      const values = [1, 2, 3];
      it ('should return an INSERT statement if that was the master function', function() {
        qb.insert('sometable').columns(columns).values(values);

        const expected = 'INSERT INTO sometable (one, two, three) VALUES (1, 2, 3);';
        const actual = qb.buildQuery();
        assert.equal(actual, expected);
      });
      it ('.. with column and value adding broken up', function() {
        qb.insert('sometable');
        columns.forEach((col, i) => {
          qb.columns(col).values(values[i]);
        });
        
        const expected = 'INSERT INTO sometable (one, two, three) VALUES (1, 2, 3);';
        const actual = qb.buildQuery();
        assert.equal(actual, expected);
      });
    });
  });

})();