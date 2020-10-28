import express from 'express';
import { authenticate, schemaValidation, isAdmin, hasValidObjectId } from '../helpers/middleware';
import { addTransactionSchema, updateTransactionSchema } from '../schemas/transaction.schema';
import TransactionController from '../controllers/transaction.controllers';

const router = express.Router();

/**
 * @swagger
 * /transaction/add:
 *   post:
 *     tags:
 *       - Transaction
 *     description: Adds a new transaction
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Transaction'
 *      description: Add a new transaction
 *     responses:
 *      '201':
 *        description: Transaction added
 *      '400':
 *        description: Error adding transaction
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/add',
  authenticate,
  isAdmin,
  schemaValidation(addTransactionSchema),
  TransactionController.add,
);

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
router.get('/all', authenticate, isAdmin, TransactionController.getAll);

/**
 * @swagger
 * /transaction/update:
 *   put:
 *     tags:
 *       - Transaction
 *     description: Updates payment date of existing transaction
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Transaction'
 *      description: Updates payment date of existing transaction
 *     responses:
 *      '200':
 *        description: Transaction updated
 *      '404':
 *        description: Transaction not found
 */
router.put(
  '/update',
  authenticate,
  isAdmin,
  schemaValidation(updateTransactionSchema),
  TransactionController.update,
);

/**
 * @swagger
 * /transaction/user:
 *   get:
 *     tags:
 *       - Transaction
 *     description: Get all transactions made by a user
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Transaction'
 *      description: Get all transactions made by a user
 *     responses:
 *      '200':
 *        description: returns object of transactions
 *      '500':
 *       description: Internal server error
 */
router.get('/user', authenticate, TransactionController.getAllPersonal);

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
  isAdmin,
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
router.get('/user/referral-rewards', authenticate, TransactionController.getReferralRewards);

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
  TransactionController.getContributionRewards,
);

module.exports = router;
