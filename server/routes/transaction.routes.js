import express from 'express';
import { authenticate, schemaValidation, isAdmin } from '../helpers/middleware';
import addTransactionSchema from '../schemas/transaction.schema';
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
 *     description: Get all enquiries
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Transaction'
 *      description: Get all transactions
 *     responses:
 *      '200':
 *        description: returns object of transactions
 *      '500':
 *       description: Internal server error
 */
router.get('/all', authenticate, isAdmin, TransactionController.getAll);

module.exports = router;
