module.exports = function(query) {
  'use strict';

  const nuggetRouter = require('express')();
  const { HEADERS, Tables } = require('../config');
  const QueryBuilder = require('../../../data/querybuilder');
  const qb = new QueryBuilder();


  nuggetRouter.get('/(:id)?', (req, res) => {
    const id = req.params.id;
    qb.select().from(Tables.NUGGET);
    if (id) 
      qb.where(`id = ${id}`);

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
    const {title, blurb, tags} = req.body;
    if (! (title && blurb)) {
      res.json({error: 'ALL_REQUIRED', message: 'Both title and blurb are required.'});
      res.end();
    }
    else {
      let nuggetResult;
      const tagIds = [];
      qb.insert(Tables.NUGGET).columns(['title', 'blurb']).values([title, blurb]);
      query(qb.buildQuery())
      .then(result => {
        return nuggetResult = result;
      })
      .then(() => {
        return new Promise(resolve => {
          if (tags) {
            const tagsArr = tags instanceof Array ? tags : [tags];
            console.log(tagsArr);

            let id;
            const promises = [];
            tagsArr.forEach(tag => {
              // sanitize the tag to make an id
              id = tag.replace(/\s+/g, '-').replace(/[/'*^\\&]/, '').toLowerCase();
              qb.insert(Tables.TAG).columns(['id', 'text']).values([id, tag]).onDuplicate('UPDATE id=id');
              promises.push(query(qb.buildQuery())
                .then(result => {
                  tagIds.push(result.insertId);
                })
                .catch(err => {
                  console.log(err); 
                })
              );
            });
            Promise.all(promises).then(resolve);
          }
        });
      })
      .then(() => {
        if (nuggetResult && tagIds.length > 0) {
          tagIds.forEach(tagId => {
            qb.insert(Tables.NUG_TAG).columns(['nugget_id', 'tag_id'])
              .values([nuggetResult.insertId, tagId]).onDuplicate('UPDATE id=id');
            query(qb.buildQuery());
          });
        }
        res.header(HEADERS.CT_JSON);
        res.json(nuggetResult);
      })
      .catch(err => {
        res.status(400).send({error: err.message});
      });
      
      
    }
  });

  return nuggetRouter;
};