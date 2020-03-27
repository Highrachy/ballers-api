import express from 'express';
import jwt from 'jsonwebtoken';
import { USER_SECRET } from '../config/config';
import User from '../models/user.model';
import { registerSchema } from '../schema/user.schema';
import { schemaValidation } from '../helpers/middleware';
import { getUserByEmail, addUser } from '../services/user.service';
import { ErrorHandler } from '../helpers/errorHandler';

const router = express.Router();

/**
 * @swagger
 * /user/register:
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

router.post('/register', schemaValidation(registerSchema), (req, res, next) => {
  const newUser = new User(req.locals);

  getUserByEmail(newUser.email)
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
            res.status(200).json({ success: true, message: 'User registered', token });
          })
          .catch((error) => next(new ErrorHandler(400, 'Error adding user', error)));
      } else {
        next(new ErrorHandler(412, 'Email is linked to another account'));
      }
    })
    .catch((error) => next(new ErrorHandler(500, 'Internal Server Error', error)));
});

module.exports = router;
