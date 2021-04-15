import express from 'express';
import {
  authenticate,
  schemaValidation,
  isAdminOrUserOrVendor,
  isUser,
  hasValidObjectId,
  isAdmin,
} from '../helpers/middleware';
import TransactionController from '../controllers/transaction.controllers';
import addRemittanceSchema from '../schemas/transaction.schema';

const router = express.Router();

/**
 * @swagger
 * /transaction/all:
 *   get:
 *     tags:
 *       - Transaction
 *     description: Get all transactions in db
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Transaction'
 *      description: Get all transactions in db
 *     responses:
 *      '200':
 *        description: returns object of transactions
 *      '500':
 *       description: Internal server error
 */
router.get('/all', authenticate, isAdminOrUserOrVendor, TransactionController.getAll);

/**
 * @swagger
 * path:
 *  /transaction/property/:id:
 *    get:
 *      parameters:
 *        - in: query
 *          name: token
 *          schema:
 *            type: string
 *          description: verifies user access
 *      summary: Get all transactions made on a property
 *      tags: [Transaction]
 *      responses:
 *        '200':
 *          description: Transactions found
 *        '500':
 *          description: Internal server error
 */
router.get(
  '/property/:id',
  authenticate,
  isAdminOrUserOrVendor,
  hasValidObjectId,
  TransactionController.getTransactionsByProperty,
);

/**
 * @swagger
 * /transaction/user/referral-rewards:
 *   get:
 *     tags:
 *       - Transaction
 *     description: Gets all of user's referral rewards
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Transaction'
 *      description: Gets all of user's referral rewards
 *     responses:
 *      '200':
 *        description: returns object of transactions
 *      '500':
 *       description: Internal server error
 */
router.get(
  '/user/referral-rewards',
  authenticate,
  isUser,
  TransactionController.getReferralRewards,
);

/**
 * @swagger
 * /transaction/user/contribution-rewards:
 *   get:
 *     tags:
 *       - Transaction
 *     description: Gets all of user's contribution rewards
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Transaction'
 *      description: Gets all of user's contribution rewards
 *     responses:
 *      '200':
 *        description: returns object of transactions
 *      '500':
 *       description: Internal server error
 */
router.get(
  '/user/contribution-rewards',
  authenticate,
  isUser,
  TransactionController.getContributionRewards,
);

/**
 * @swagger
 * path:
 *  /transaction/:id:
 *    get:
 *      parameters:
 *        - in: query
 *          name: token
 *          schema:
 *            type: string
 *          description: verifies user access
 *      summary: Gets a transaction based by its ID
 *      tags: [Transaction]
 *      responses:
 *        '200':
 *          description: Transaction found
 *        '500':
 *          description: Internal server error
 */
router.get(
  '/:id',
  authenticate,
  isAdminOrUserOrVendor,
  hasValidObjectId,
  TransactionController.getOneTransaction,
);

/**
 * @swagger
 * /transaction/remittance:
 *   put:
 *     tags:
 *       - Transaction
 *     description: Adds remittance for a specific transaction
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Transaction'
 *      description: Adds remittance for a specific transaction
 *     responses:
 *      '200':
 *        description: Remittance added
 *      '400':
 *        description: Error adding remittance
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/remittance',
  authenticate,
  isAdmin,
  schemaValidation(addRemittanceSchema),
  TransactionController.addRemittance,
);

module.exports = router;
