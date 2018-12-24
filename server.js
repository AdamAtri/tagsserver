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

  const debugCerts = resolve(__dirname, '..', 'test-certs')
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
app.use(express.static(join(__dirname, 'public'), publicOptions));

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


server80.listen(16080, () => {console.log('Tags Server listening on 16080');});
if (server443) {
  server443.listen(16443, () => {console.log('Tags Server listening on 16443');});
}