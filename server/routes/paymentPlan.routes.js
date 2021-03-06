import express from 'express';
import { authenticate, schemaValidation, isAdmin, hasValidObjectId } from '../helpers/middleware';
import { addPaymentPlanSchema, updatePaymentPlanSchema } from '../schemas/paymentPlan.schema';
import PaymentPlanController from '../controllers/paymentPlan.controllers';

const router = express.Router();

/**
 * @swagger
 * /payment-plan/add:
 *   post:
 *     tags:
 *       - PaymentPlan
 *     description: Adds a new payment plan
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/PaymentPlan'
 *      description: Adds a new payment plan
 *     responses:
 *      '201':
 *        description: Payment plan added
 *      '400':
 *        description: Error adding Payment plan
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/add',
  authenticate,
  isAdmin,
  schemaValidation(addPaymentPlanSchema),
  PaymentPlanController.add,
);

/**
 * @swagger
 * /payment-plan/all:
 *   get:
 *     tags:
 *       - PaymentPlan
 *     description: Get all payment plans
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/PaymentPlan'
 *      description: Get all owned enquiries
 *     responses:
 *      '200':
 *        description: returns object of payment plans
 *      '500':
 *       description: Internal server error
 */
router.get('/all', authenticate, isAdmin, PaymentPlanController.getAll);

/**
 * @swagger
 * /payment-plan/delete/:id:
 *   delete:
 *     tags:
 *       - PaymentPlan
 *     description: Deletes specific payment plan
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/PaymentPlan'
 *      description: Deletes specific payment plan
 *     responses:
 *      '200':
 *        description: Payment Plan deleted
 *      '500':
 *       description: Internal server error
 */
router.delete('/delete/:id', authenticate, hasValidObjectId, isAdmin, PaymentPlanController.delete);

/**
 * @swagger
 * /payment-plan/update:
 *   put:
 *     tags:
 *       - PaymentPlan
 *     description: Updates existing payment plan
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/PaymentPlan'
 *      description: Updates existing payment plan
 *     responses:
 *      '200':
 *        description: Payment plan updated
 *      '400':
 *        description: Error updating payment plan
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/update',
  authenticate,
  isAdmin,
  schemaValidation(updatePaymentPlanSchema),
  PaymentPlanController.update,
);

module.exports = router;
