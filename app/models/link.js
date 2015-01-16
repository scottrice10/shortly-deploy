var mongoose = require('mongoose');
var db = require('../config');
var crypto = require('crypto');

var linkSchema = new mongoose.Schema({
  url: String,
  base_url: String,
  code: String,
  title: String,
  visits: Number,
});

linkSchema.pre('save', function(next) {
  var link = this;
  var shasum = crypto.createHash('sha1');
  shasum.update(link.url);
  link.code = shasum.digest('hex').slice(0, 5);
  next();
});

var Link = db.model('Link', linkSchema);

module.exports = Link;
