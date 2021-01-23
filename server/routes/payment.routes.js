import express from 'express';
import paymentSchema from '../schemas/payment.schema';
import { schemaValidation, authenticate } from '../helpers/middleware';
import PaymentController from '../controllers/payment.controllers';

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

/**
 * @swagger
 * /payment/verify/:ref:
 *   get:
 *     tags:
 *       - Payment
 *     description: Verify users payment Paystack
 *     produces:
 *       - application/json
 *     responses:
 *      '200':
 *        description: Payment Verified
 *      '500':
 *       description: Internal server error
 */
router.get('/verify/:ref', PaymentController.paymentVerification);

/**
 * @swagger
 * /payment/process/:ref:
 *   get:
 *     tags:
 *       - Payment
 *     description: Add payment to transaction model
 *     produces:
 *       - application/json
 *     responses:
 *      '200':
 *        description: Payment saved
 *      '500':
 *       description: Internal server error
 */
router.get('/process/:ref', PaymentController.addPaymentToTransaction);

module.exports = router;
