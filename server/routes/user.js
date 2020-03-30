import express from 'express';
import jwt from 'jsonwebtoken';
import { USER_SECRET } from '../config/config';
import User from '../models/user.model';
import { getByEmail, addUser } from '../services/user.service';

const router = express.Router();

/**
 * @swagger
 * /register:
 *   post:
 *     tags:
 *       - User
 *     description: Creates a new user
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/User'
 *      description: Inventory item to add
 *     responses:
 *      '200':
 *        description: Success, but email is linked to another account
 *      '201':
 *        description: User created
 *      '400':
 *        description: Invalid input parameters. Or passwords should match
 *      '500':
 *       description: Internal server error
 */

router.post('/register', (req, res) => {
  const newUser = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    phone: req.body.phone,
  });
  if (req.body.password === req.body.confirmPassword) {
    getByEmail(newUser.email)
      .then((user) => {
        if (!user) {
          addUser(newUser)
            .then((createdUser) => {
              const token = jwt.sign(
                {
                  data: { id: createdUser._id },
                },
                USER_SECRET,
                { expiresIn: '30d' },
              );
              res.status(201).json({ success: true, message: 'User registered', token });
            })
            .catch((error) => {
              res.status(500).json({ success: false, message: 'Error adding user', error });
            });
        } else {
          res.status(200).json({
            success: false,
            message: 'Email is linked to another account',
          });
        }
      })
      .catch((error) => {
        res.status(500).json({ success: false, message: 'Internal Server Error', error });
      });
  } else {
    res.status(400).json({ success: false, message: 'Passwords should match' });
  }
});

module.exports = router;
