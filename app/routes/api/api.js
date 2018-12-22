// API Router
//  The starting point for all '/api' calls

module.exports = function() {
  'use strict';

  const express = require('express');
  const APIRouter = express();
  const { query } = require('../../data/dbconnection');
  const { HEADERS } = require('./config');

  // /**
  //   Light api call to check auth status
  // */
  // APIRouter.get('/authorized', (req, res) => {
  //   res.setHeader(HEADERS.CT_JSON);
  //   res.json({auth: req.isAuthenticated() });
  // });

  // /*****
  // *  From this point forward, all requests must originate from authenticated sources.
  // **/
  // APIRouter.all('/*', (req, res, next) => {
  //   if (! req.isAuthenticated()) {
  //     res.setHeader(HEADERS.CT_JSON);
  //     return res.status(401).json({auth: false });
  //   }
  //   next();
  // });

  /*****
  *   Initialize the UserRouter with the "dbClient" for user related api requests
  */
  // APIRouter.use('/users', require('./modules/Users')(dbClient));

  APIRouter.get('/', (req, res) => {
    console.log(req);
    res.json({message: 'get api'});
  });
  APIRouter.use('/nugget', require('./modules/Nugget')(query));



  return APIRouter;
};