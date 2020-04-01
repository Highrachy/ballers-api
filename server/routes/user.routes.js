import express from 'express';
import { registerSchema } from '../schemas/user.schema';
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
 *      '200':
 *        description: Success, but email is linked to another account
 *      '201':
 *        description: User created
 *      '400':
 *        description: Invalid input parameters. Or passwords should match
 *      '500':
 *       description: Internal server error
 */

router.post('/register', schemaValidation(registerSchema), UserController.register);

module.exports = router;
