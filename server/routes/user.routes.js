import express from 'express';
import passport from 'passport';
import { registerSchema, loginSchema } from '../schemas/user.schema';
import { schemaValidation } from '../helpers/middleware';
import UserController from '../controllers/user.controllers';

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
 *      '201':
 *        description: User created
 *      '400':
 *        description: Error adding user
 *      '412':
 *        description: Email is linked to another account
 *      '500':
 *       description: Internal server error
 */

router.post('/register', schemaValidation(registerSchema), UserController.register);

/**
 * @swagger
 * /user/login:
 *   post:
 *     tags:
 *       - User
 *     description: Authenticates user
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              email:
 *                  type: string
 *                  example: john@mail.com
 *              password:
 *                  type: string
 *      description: Login Details
 *     responses:
 *      '200':
 *        description: Login Successful
 *      '401':
 *        description: Invalid email or password
 *      '500':
 *       description: Internal server error
 */

router.post('/login', schemaValidation(loginSchema), UserController.login);

router.get(
  '/auth/facebook',
  passport.authenticate('facebook', {
    authType: 'rerequest',
    scope: ['email'],
  }),
);

router.get(
  '/auth/facebook/callback',
  passport.authenticate('facebook', {
    successRedirect: '/api/v1/user/auth/facebook/success',
    failureRedirect: '/api/v1/user/auth/facebook/fail',
  }),
);

router.get('/auth/facebook/success', (req, res) => {
  res.send('Success');
});

router.get('/auth/facebook/fail', (req, res) => {
  res.send('Failed attempt');
});

export default router;
