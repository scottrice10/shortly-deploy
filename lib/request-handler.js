var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

var db = require('../app/config');
var User = require('../app/models/user');
var Link = require('../app/models/link');

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  Link.exec(function(link) {
    res.send(200, link.models);
  })
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  Link.findOne({
    url: uri
  }).exec(function(err, found) {
    if (err) {
      next(err);
    }

    if (found) {
      res.send(200, found);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save(function(err, newLink) {
          if (err) {
            next(err);
          } else {
            res.send(200, newLink);
          }
        });
      });
    }
  });
};

exports.loginUser = function(req, res, next) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({
      username: username
    })
    .exec(function(err, user) {
      if (err) {
        next(err);
      }

      if (!user) {
        res.redirect('/login');
      } else {
        user.comparePassword(password, function(err, match) {
          if (err) {
            next(err);
          }

          if (match) {
            util.createSession(req, res, user);
          } else {
            res.redirect('/login');
          }
        })
      }
    });
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({
      username: username
    })
    .exec(function(err, user) {
      if (err) {
        next(err);
      }

      if (!user) {
        var newUser = new User({
          username: username,
          password: password
        });
        newUser.save(function(err, newUser) {
          if (err) {
            next(err);
          } else {
            util.createSession(req, res, newUser);
          }
        });
      } else {
        console.log('Account already exists');
        res.redirect('/signup');
      }
    })
};

exports.navToLink = function(req, res, next) {
  Link.findOne({
      code: req.params[0]
    })
    .exec(function(err, link) {
      if (err) {
        next(err);
      }

      if (!link) {
        res.redirect('/');
      } else {
        link.visits += 1;
        link.save(function(err, link) {
          if (err) {
            next(err);
          } else {
            return res.redirect(link.url);
          }
        });
      }
    });
};
