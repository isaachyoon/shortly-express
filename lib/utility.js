var request = require('request');

exports.getUrlTitle = function(url, cb) {
  //makes a get request to the url, when the html assets return
  //finds the title tag in page and calls the callback on either the title or the url if there's no title
  request(url, function(err, res, html) {
    if (err) {
      console.log('Error reading url heading: ', err);
      return cb(err);
    } else {
      var tag = /<title>(.*)<\/title>/;
      var match = html.match(tag);
      var title = match ? match[1] : url;
      return cb(err, title);
    }
  });
};

var rValidUrl = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;

exports.isValidUrl = function(url) {
  return url.match(rValidUrl);
};

/************************************************************/
// Add additional utility functions below
/************************************************************/


exports.checkUser = function(req, res, next) {
  //will complete this later with real authentication and use of express-sessions & cookies
  // console.log(req.user);
  // console.log('req header', req.headers);
  // console.log('last page', req.session.lastPage);
  // console.log('req.session.id: ', req.session.id, 'req.session: ', req.session, 'req.session.user: ', req.session.user);
  if (req.session && req.session.user) {
    next();
  } else { 
    // req.session.destroy(function(err) {
    //   if (err) { throw 'session destroy error'; }
    //   res.redirect('login');
    // });
    res.redirect('login');
  }
};