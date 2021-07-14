import express from 'express';
import { addAccountSchema, updateAccountSchema } from '../schemas/bankAccount.schema';
import { schemaValidation, authenticate, isAdmin, hasValidObjectId } from '../helpers/middleware';
import BankAccountController from '../controllers/bankAccount.controllers';

const router = express.Router();

/**
 * @swagger
 * /account/:
 *   post:
 *     tags:
 *       - BankAccount
 *     description: Allows an admin add an account
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/BankAccount'
 *      description: Allows an admin add an account
 *     responses:
 *      '201':
 *        description: Account added successfully
 *      '400':
 *        description: Error adding account
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  schemaValidation(addAccountSchema),
  BankAccountController.addAccount,
);

/**
 * @swagger
 * /account/:
 *   put:
 *     tags:
 *       - BankAccount
 *     description: Updates existing account
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/BankAccount'
 *      description: Updates existing account
 *     responses:
 *      '200':
 *        description: Account updated
 *      '400':
 *        description: Error updating account
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/',
  authenticate,
  isAdmin,
  schemaValidation(updateAccountSchema),
  BankAccountController.editAccount,
);

/**
 * @swagger
 * /account/approve/:id:
 *   put:
 *     tags:
 *       - BankAccount
 *     description: Approves existing account
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/BankAccount'
 *      description: Approves existing account
 *     responses:
 *      '200':
 *        description: Account approved
 *      '400':
 *        description: Error approving account
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/approve/:id',
  authenticate,
  isAdmin,
  hasValidObjectId,
  BankAccountController.approveAccount,
);

/**
 * @swagger
 * /account/:id:
 *   delete:
 *     tags:
 *       - BankAccount
 *     description: Deletes specific account
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/BankAccount'
 *      description: Deletes specific account
 *     responses:
 *      '200':
 *        description: Account deleted
 *      '500':
 *       description: Internal server error
 */
router.delete('/:id', authenticate, hasValidObjectId, isAdmin, BankAccountController.deleteAccount);

/**
 * @swagger
 * /account/all:
 *   get:
 *     tags:
 *       - BankAccount
 *     description: Gets all accounts
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/BankAccount'
 *      description: Gets all accounts
 *     responses:
 *      '200':
 *        description: returns all accounts
 *      '500':
 *       description: Internal server error
 */
router.get('/all', BankAccountController.getAllAccounts);

module.exports = router;
