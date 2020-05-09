import express from 'express';
import { paymentSchema } from '../schemas/payment.schema';
import { schemaValidation, authenticate } from '../helpers/middleware';
import PaymentController from '../controllers/payment.controller';

const router = express.Router();

/**
 * @swagger
 * /payment/initiate:
 *   post:
 *     tags:
 *       - Payment
 *     description: Initiates a new payment from Paystack
 *     produces:
 *       - application/json
 *     responses:
 *      '200':
 *        description: Payment Initiated
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/initiate',
  authenticate,
  schemaValidation(paymentSchema),
  PaymentController.paymentInitiation,
);

module.exports = router;
