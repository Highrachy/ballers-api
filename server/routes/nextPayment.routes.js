import express from 'express';
import { authenticate, isAdminOrUserOrVendor } from '../helpers/middleware';
import NextPaymentController from '../controllers/nextPayment.controllers';

const router = express.Router();

/**
 * @swagger
 * /next-payment/all:
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

/**
 * @swagger
 * /next-payment/reminder:
 *   get:
 *     tags:
 *       - NextPayment
 *     description: Send reminders for next payments
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/NextPayment'
 *      description: Send reminders for next payments
 *     responses:
 *      '200':
 *        description: Sends reminders
 *      '500':
 *       description: Internal server error
 */
router.get('/send-reminders', NextPaymentController.sendReminder);

module.exports = router;
