import express from 'express';
import moment from 'moment';
import jwt from 'jsonwebtoken';
import { USER_SECRET } from '../config/config';
import User from '../controllers/user.model';

const router = express.Router();
const now = `${moment().format('LLLL')} ${new Date().toString().match(/([A-Z]+[\+-][0-9]+.*)/)[1]}`;

router.post('/register', (req, res) => {
  const newUser = new User({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    password: req.body.password,
    phone: req.body.phone,
    createdAt: now,
    updatedAt: now,
  });

  if (newUser.password !== req.body.confirmPassword) {
    res.status(200).send({ success: false, message: 'Passwords must match' });
  } else {
    User.getUserByEmail(newUser.email, (error, user) => {
      if (error) {
        res.status(500).send({ success: false, message: 'Something\'s not right (email)' });
      }
      if (user) {
        res.status(200).send({ success: false, message: 'Email is linked to another account' });
      } else {
        User.getUserByPhone(newUser.phone, (error1, user1) => {
          if (error1) {
            res.status(500).send({ success: false, message: 'Something\'s not right (phone)' });
          }
          if (user1) {
            res.status(200).send({ success: false, message: 'Phone number is linked to another account' });
          } else {
            User.addUser(newUser, (error2, user2) => {
              if (error2) {
                res.status(500).send({ success: false, message: 'Something\'s not right (add)' });
              } else {
                user2.email = null;
                user2.password = null;
                user2.phone = null;
                const token = jwt.sign(user2.toJSON(), USER_SECRET, {
                  expiresIn: '24h',
                });
                res.status(200).send({ success: true, message: 'Account registered', token });
              }
            });
          }
        });
      }
    });
  }
});

module.exports = router;
