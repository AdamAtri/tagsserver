module.exports = function(query) {
  'use strict';

  const nuggetRouter = require('express')();
  const { HEADERS, Nugget } = require('../config');
  const QueryBuilder = require('../../../data/querybuilder');
  const qb = new QueryBuilder();


  nuggetRouter.get('/(:id)?', (req, res, next) => {
    const id = req.params.id;
    qb.select().from(Nugget.TABLE);
    if (id) 
      qb.where(`id === ${id}`);
    // dbClient.getDocById(USERS.COLLECTION, req.user._id, {id: false, password: false})
    query(qb.buildQuery())
      .then(result => {
        res.header(HEADERS.CT_JSON);
        res.json(result);
      })
      .catch(err => {
        res.status(404).end(err.message);
      });
  });

  nuggetRouter.post('/', (req, res) => {
    const {title, blurb} = req.body;
    if (! (title && blurb)) {
      res.json({error: 'ALL_REQUIRED', message: 'Both title and blurb are required.'});
      res.end();
    }
    else {
      qb.insert(Nugget.TABLE).columns(['title', 'blurb']).values([title, blurb])
      query(qb.buildQuery())
      .then(result => {
        res.header(HEADERS.CT_JSON);
        res.json(result);
      })
      .catch(err => {
        res.status(400).send({error: err.message});
      });
      
    }
  });

  return nuggetRouter;
};