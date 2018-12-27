const express = require('express'),
router = express.Router(),
bcrypt = require('bcrypt'),
path = require('path'),
jwt = require('jsonwebtoken'),
db = require('../database/db'),
filesystem = require('../services/filesystem'),
__mainDir = path.join(__dirname, '..');

/* LOGIN USER */
router.post('/login', function (req, res) {
  db.Operations.SelectWhere(db.Models.User, 'username', req.body.username).then(data => {
    if (data.length > 0) {
      var [{ _id, password }] = data;
      bcrypt.compare(req.body.password, password, function(err, match) {
        if (match) {
          // Passwords match
          var token = jwt.sign({ userID: _id }, 'secret', { expiresIn: '2h' });
          res.send({ access_token: token });
        }
        else {
          res.send({ alert: 'INCORRECT-PASSWORD' });
        }
      });
    }
    else {
      res.send({ alert: 'USER-UNREGISTERED' });
    }
  })
});

/* REGISTER USER */
router.post('/register', function (req, res) {
  db.Operations.SelectWhere(db.Models.User, 'username', req.body.username).then(data => {
    if (data.length > 0)
      res.send({ alert: 'USERNAME-BUSY' });
    else {
      db.Operations.SelectWhere(db.Models.User, 'email', req.body.email).then(data => {
        if (data.length > 0)
          res.send({ alert: 'EMAIL-BUSY' });
        else {
          bcrypt.hash(req.body.password, 10, function(err, hash) {
            const user = new db.Models.User({
              username: req.body.username,
              password: hash,
              email: req.body.email
            });

            user.validate(err => console.log(err));

            db.Operations.InsertOne(user).catch(console.error);

            const path = `${__mainDir}/uploads/${req.body.username}`;
            filesystem.create_folder(path).catch(console.error);

            res.send({ alert: 'USER-REGISTERED', reset: true });
          });
        }
      })
    } 
  })
});

module.exports = router;