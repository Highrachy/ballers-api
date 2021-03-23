import express from 'express';
import { authenticate, isAdminOrUserOrVendor } from '../helpers/middleware';
import NextPaymentController from '../controllers/nextPayment.controllers';

const router = express.Router();

/**
 * @swagger
 * /next-payments/all:
 *   get:
 *     tags:
 *       - NextPayment
 *     description: Get all related next payments
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/NextPayment'
 *      description: Get all related next payments
 *     responses:
 *      '200':
 *        description: returns next payments
 *      '500':
 *       description: Internal server error
 */
router.get('/all', authenticate, isAdminOrUserOrVendor, NextPaymentController.getNextPayments);

module.exports = router;
