var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(session({
  secret: 'isaac',
  resave: false,
  saveUninitialized: true
}));

app.get('/', util.checkUser, function(req, res) {
  res.render('index');
  res.end();
});

app.get('/create', util.checkUser, function(req, res) {
  res.render('index');
});

app.get('/links', util.checkUser, function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });
});

app.post('/links', function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

app.get('/login', function(req, res) {
  
  //Use for the purpose of clearing table:
  // db.knex.schema.dropTable('users');
  // // .then(function(rows) {
  //   db.knex.select().from('users').then(function(rows) {
  //     console.log('user table: ', rows);
  //   });
  // });


  res.render('login');
  res.end();
});

app.post('/login', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  

  db.knex.select('password').from('users').where('username', username)
    .then(function(hashedPassword) {
      console.log('knex queried password: ', hashedPassword[0].password);
      console.log('input password: ', password);  
      // console.log('am i selecting the right rows?', JSON.stringify(rows));
      bcrypt.compare(password, hashedPassword[0].password, function(err, matched) {
        console.log('result of match', matched);
        if (matched) {
          req.session.user = username;
          // console.log('req session user ', req.session.user);  
          res.redirect('/');
          res.end();
        } else {
          res.redirect('/login');
          res.end();
        }
      });

    });
  
});
//make app.post function to handle when a user is logging in
  //then query the database to see if the username & password exists
  //if user exists in database
    //...

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.post('/signup', function(req, res) {
  bcrypt.genSalt(3, function(err, salt) {
    bcrypt.hash(req.body.password, salt, null, function(err, hash) {
      // console.log('err', err);
      // console.log('hash', hash);
      new User({'username': req.body.username, 'password': hash})
      .save().then(function(model) {
        db.knex.select().from('users').then(function(rows) { 
          console.log(JSON.stringify(rows));
          res.end(JSON.stringify(rows)); 
        });
      });
    });
  });
  res.redirect('/');
  res.end();
  // db.knex.select().from('users').then(function(rows) { console.log('users table after', rows); } );
});

app.get('/logout', function(req, res) {
  req.session.destroy((err) => {
    if (err) { throw 'error ending session'; }
    res.redirect('login');
    res.end();
  });
});
/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

module.exports = app;
