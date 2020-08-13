import express from 'express';
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateUserSchema,
} from '../schemas/user.schema';
import { schemaValidation, authenticate, isAdmin } from '../helpers/middleware';
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

/**
 * @swagger
 * path:
 *  /user/activate:
 *    get:
 *      parameters:
 *        - in: query
 *          name: token
 *          schema:
 *            type: string
 *          description: the auto generated user token via jwt
 *      summary: Activates a user account via token
 *      tags: [User]
 *      responses:
 *        '200':
 *          description: Your account has been successfully activated
 *        '404':
 *          description: User not found
 *        '500':
 *          description: Internal server error
 */
router.get('/activate', UserController.activateToken);

/**
 * @swagger
 * /user/reset-password:
 *   post:
 *     tags:
 *       - User
 *     description: Sends a reset password link to user
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
 *      description: Generates Reset Password Link
 *     responses:
 *      '200':
 *        description: A password reset link has been sent to your email account
 *      '401':
 *        description: Your email address is not found. Please check and Try Again.
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/reset-password',
  schemaValidation(resetPasswordSchema),
  UserController.generateResetPasswordLink,
);

/**
 * @swagger
 * /user/change-password:
 *   post:
 *     tags:
 *       - User
 *     description: Changes a User Password
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *          type: string
 *         description: the auto generated user token via jwt
 *       - in: formData
 *         name: password
 *         schema:
 *          type: string
 *         description: the new password
 *       - in: formData
 *         name: confirmPassword
 *         schema:
 *          type: string
 *         description: confirm password
 *     summary: Changes a user password
 *     responses:
 *      '200':
 *        description: Your password has been successfully changed
 *      '404':
 *        description: User not found
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/change-password/:token',
  schemaValidation(changePasswordSchema),
  UserController.resetPasswordFromLink,
);

/**
 * @swagger
 * path:
 *  /user/activate:
 *    get:
 *      parameters:
 *        - in: query
 *          name: token
 *          schema:
 *            type: string
 *          description: the auto generated user token via jwt
 *      summary: Activates a user account via token
 *      tags: [User]
 *      responses:
 *        '200':
 *          description: Your account has been successfully activated
 *        '404':
 *          description: User not found
 *        '500':
 *          description: Internal server error
 */
router.get('/who-am-i', authenticate, UserController.currentUser);

/**
 * @swagger
 * /user/update:
 *   put:
 *     tags:
 *       - User
 *     description: Updates existing user
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/User'
 *      description: Updates existing user
 *     responses:
 *      '200':
 *        description: User updated
 *      '400':
 *        description: Error updating user
 *      '500':
 *       description: Internal server error
 */
router.put('/update', authenticate, schemaValidation(updateUserSchema), UserController.update);

/**
 * @swagger
 * /user/all:
 *   get:
 *     tags:
 *       - User
 *     description: Get all registered users
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/User'
 *      description: Get all registered users
 *     responses:
 *      '200':
 *        description: returns object of users
 *      '500':
 *       description: Internal server error
 */
router.get('/all', authenticate, isAdmin, UserController.getAllRegisteredUsers);

module.exports = router;
