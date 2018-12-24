module.exports = function(query) {
  'use strict';

  const nuggetRouter = require('express')();
  const { HEADERS, Tables } = require('../config');
  const QueryBuilder = require('../../../data/querybuilder');
  const qb = new QueryBuilder();


  /**
   * Get the entire list or just one
   */
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

  /** 
   * 
   */
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
        //console.log('>> got nugget insert result ', result);
        nuggetResult = result;
        return nuggetResult;
      })
      .then(() => {
        //console.log('>> starting tag inserts');
        return new Promise(m_resolve => {
          if (tags) {
            const tagsArr = tags instanceof Array ? tags : [tags];
            const promises = [];
            tagsArr.forEach(tag => {
              promises.push(new Promise((resolve, reject) => {
                // sanitize the tag to make an id
                const id = escape(tag.replace(/\s+/g, '-').replace(/[/'*^\\&]/, '').toLowerCase());
                // first query if the id is present
                qb.select().from(Tables.TAG).where(`id = "${id}"`);
                query(qb.buildQuery()).then(getResult => {
                  if (getResult && getResult.length == 1) {
                    tagIds.push(id);
                    resolve();
                  }
                  else {
                    qb.insert(Tables.TAG).columns(['id', 'text']).values([id, tag]).onDuplicate('UPDATE id=id');
                    query(qb.buildQuery())
                    .then((/*insertResult*/) => {
                      //console.log('insertResult', insertResult);
                      tagIds.push(id);
                      resolve();
                    })
                    .catch(err => {
                      console.error(err); 
                      reject();
                    });
                  }
                });
              }).catch(e => {
                res.status(500).send('Internal error while inserting nugget: ' + e.message);
              }));
            });
            
            Promise.all(promises).then(() => {
              //console.log('>> all tag insert promises resolved');
              m_resolve();
            });
          }
          else {
            // if there are no tags, we're done
            m_resolve();
          }
        });
      })
      .then(() => {
        //console.log('>> insert nugget_tags', nuggetResult.insertId, tagIds);
        if (nuggetResult && tagIds.length > 0) {
          tagIds.forEach(tagId => {
            qb.insert(Tables.NUG_TAG).columns(['nugget_id', 'tag_id'])
              .values([nuggetResult.insertId, tagId]).onDuplicate('UPDATE nugget_id=nugget_id');
            query(qb.buildQuery());
          });
        }
        res.header(HEADERS.CT_JSON);
        res.json({nugget: nuggetResult.insertId, tags: tagIds});
      })
      .catch(err => {
        res.status(400).send({error: err.message});
      });
      
      
    }
  });

  return nuggetRouter;
};