//module.exports = 
function QueryBuilder() {
  var current;
  var currentModifier;
  var queryString;
}

// SELECT 
QueryBuilder.prototype.select = function select(columns=['*']) {
  this.query = null;
  this.current = {
    function: 'select',
    columns
  }
  return this;
};

QueryBuilder.prototype.from = function from(table) {
  const currentObj = this.current;
  if (! (currentObj && currentObj.function)) throw new ReferenceError('Cannot assign table to null');
  currentObj.tableAccess = 'from';
  currentObj.table = table;
  return this;
};
QueryBuilder.prototype.distinct = function distinct() {
  this.current.distinct = true;
  return this;
};
QueryBuilder.prototype.where = function where(condition) {
  this.currentModifier = 'where';
  this.current.where = [];
  let and = this.and.bind(this);
  return and(condition);
};
QueryBuilder.prototype.and = function and(condition) {
  condition = condition instanceof Array ? condition : [condition];
  this.current[this.currentModifier] = this.current[this.currentModifier].concat(condition);
  return this;
};

// INSERT
QueryBuilder.prototype.insert = function insert(intoTable) {
  this.query = null;
  this.current = {
    function: 'insert',
    tableAccess: 'into',
    table: intoTable,
    columns: [], 
    values: []
  }
  return this;
};

QueryBuilder.prototype.columns = function columns(columns) {
  columns = columns instanceof Array ? columns : [columns];
  this.current.columns = this.current.columns.concat(columns);
  return this;
};
QueryBuilder.prototype.values = function values(values) {
  values = values instanceof Array ? values : [values];
  let newValues = this.current.values.concat(values);
  if (this.current.columns.length != newValues.length) 
    throw new RangeError('the length properties of the two arrays do not match.')
  newValues = newValues.map(v => {
    if (typeof(v) === 'string') return `"${v}"`;
    return v;
  });
  this.current.values = newValues;
  return this;
};


// QUERY BUILD
QueryBuilder.prototype.buildQuery = function buildQuery() {
  if (!this.query) {
    if (this.current && this.current.function && this.current.table) {
      this.query = this.current.function == 'select' ? this.buildSelect(this.current) :
                   this.current.function == 'insert' ? this.buildInsert(this.current) : null;
    }
  
    else {
      throw new Error('unable to create query');
    }
  }
  return this.query.trim();
};

QueryBuilder.prototype.buildSelect = function buildSelect(currentObj) {
  const {columns, table, distinct, where } = currentObj;
  return `SELECT ${distinct ? "DISTINCT " : ""}${columns.join(', ')} from ${table}${where ? ' where ' + where.join(' and '):''};`;
}

QueryBuilder.prototype.buildInsert = function buildInsert(currentObj) {
  const {values,columns, table } = currentObj;
  return `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
}

module.exports = QueryBuilder;