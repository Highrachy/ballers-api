import express from 'express';
import jwt from 'jsonwebtoken';
import { USER_SECRET } from '../config/config';
import User from '../models/user.model';
import { getEmail, addUser } from '../services/user.services';

const router = express.Router();

router.post('/register', (req, res) => {
  const newUser = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    phone: req.body.phone,
  });
  if (req.body.password === req.body.confirmPassword) {
    getEmail(newUser.email)
      .then((user) => {
        if (user === false) {
          addUser(newUser).then((id) => {
            const token = jwt.sign(id.toJSON(), USER_SECRET, {
              expiresIn: '30d',
            });
            res.status(200).json({ success: true, message: 'User registered', token });
          }).catch((error) => {
            res.status(500).json({ status: false, message: 'Error adding user', error });
          });
        } else {
          res.status(200).json({ success: false, message: 'Email is linked to another account' });
        }
      }).catch((error) => {
        res.status(500).json({ status: false, message: 'Internal Server Error', error });
      });
  } else {
    res.status(500).json({ status: false, message: 'Passwords should match' });
  }
});

module.exports = router;
