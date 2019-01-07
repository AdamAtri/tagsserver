const express = require('express');
const http = require('http');
const https = require('https');
const app = express();
const fs = require('fs');
const { join, resolve } = require('path');

const { SECRETS } = require('./config/app.js');
const IS_PROD = process.env.NODE_ENV === 'production';

const server80 = http.createServer(app);
const server443 = (function() {
  if (IS_PROD) {
    const prodDir = join('/', 'home', 'ubuntu', 'production');
    const production = join(prodDir, 'config-dir', 'live', 'atricoware.com');
    const options = {
      key: fs.readFileSync(join(production, 'privkey.pem')),
      cert: fs.readFileSync(join(production, 'fullchain.pem'))
    };
    return https.createServer(options, app);
  }

  const debugCerts = resolve(__dirname, '..', 'test-certs');
  const options = {
    key: fs.readFileSync(join(debugCerts, 'key.pem')),
    cert: fs.readFileSync(join(debugCerts, 'test-cert.pem'))
  };
  return https.createServer(options, app);
})();


// remove x-powered-by header on all responses.
app.all('/*', (req, res, next) => {
  res.setHeader('X-Powered-By', 'caffeine-and-sarcasm');
  next();
});


// in PROD env, only allow "HTTPS"
if (IS_PROD) {
  app.use((req, res, next) => {
    if (! req.secure ) {
      res.set({'Cache-Control':'private, max-age=31536000'});
      return res.redirect(`https://${req.get('Host')}${req.url}`);
    }
    next();
  });
}

// setup static files
const publicOptions = {
  dotfiles: 'allow',
  lastModified: true,
  maxAge: '1d',
  setHeaders: function(res) {
    res.set({
      'Cache-Control':'private'
    });
  }
};
app.use(express.static(join(__dirname, 'client', 'dist', 'client'), publicOptions));

// setup logging
app.use(require('morgan')('combined'));

// setup parsers
const bodyparser = require('body-parser');
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));
const cookieparser = require('cookie-parser');
app.use(cookieparser(SECRETS));

app.use((req, res, next) => {
  if (! req.signedCookies.user ) {
    const uuid = require('uuid');
    res.cookie('user', {id:uuid()}, {httpOnly:true, signed: true});
  }
  else {
    console.log(req.signedCookies.user);
  }
  next();
});

// // setup authentication with passport
// app.use(require('express-session')({secret: SECRETS, resave: false, saveUninitialized: false}));
// require('./auth/passport-auth').init(app);


// customer contact portal
// const contactsRouter = require('./routes/contacts/contacts.js');
// app.use('/contacts', contactsRouter);

// api routing
const APIRouter = require('./app/routes/api/api.js');
app.use('/api', APIRouter());

// app.get('/sms', (req, res) => {res.send('sms')});
// app.post('/sms', (req, res) => {
//   const {SMSParams, sendTxt} = require('./aws/index.js');
//   const smsParam = new SMSParams();
//   smsParam.message(req.body.message);
//   smsParam.phone(req.body.phone);
//   sendTxt(smsParam).then(data => {console.log(data); res.end(); }).catch(console.error);
// });


const heroes = [
  { id: 11, name: 'Mr. Nice' },
  { id: 12, name: 'Narco' },
  { id: 13, name: 'Bombasto' },
  { id: 14, name: 'Celeritas' },
  { id: 15, name: 'Magneta' },
  { id: 16, name: 'RubberMan' },
  { id: 17, name: 'Dynama' },
  { id: 18, name: 'Dr IQ' },
  { id: 19, name: 'Magma' },
  { id: 20, name: 'Tornado' }
];
app.get('/heroes(/:id)?', (req, res) => {
  let result = heroes;
  if (req.params.id) {
    const pHero = heroes.filter(h => h.id === +req.params.id);
    if (pHero.length > 0) 
      result = pHero[0];
  }
  else if (req.params) {
    console.log(req.params);
  } 
  res.json(result);
});

app.put('/heroes', (req, res) => {
  const inHero = req.body;
  if (! (inHero && inHero.id) ) res.status(400).json({error: 'must provide body'});
  let result = {};
  for (let i in heroes) {
    if (heroes[i].id === +inHero.id) {
      heroes[i] = Object.assign({}, heroes[i], inHero);
      result = heroes[i];
      break;
    }
  }
  res.json(result);
});

app.post('/heroes', (req, res) => {
  const inHero = req.body;
  if (! (inHero && inHero.name)) res.status(400).json({error: 'must provide body for post'});
  if (inHero.id) res.status(400).json({error: 'to update a model use PUT'});
  const id = heroes.length + 11;
  const newHero = Object.assign({}, inHero, {id});
  heroes.push(newHero);
  res.json(newHero);
});

app.delete('/heroes/:id', (req, res) => {
  const idToDelete = req.params.id;
  if (idToDelete) {
    const toDelete = heroes.find(h => h.id === +idToDelete);
    heroes.splice(heroes.indexOf(toDelete), 1);
  }
  res.json(heroes);
});

app.get('*', (req, res) => {
  res.status(300).sendFile(join(__dirname, 'client', 'dist', 'client', 'index.html'));
});


server80.listen(16080, () => {console.log('Tags Server listening on 16080');});
if (server443) {
  server443.listen(16443, () => {console.log('Tags Server listening on 16443');});
}