import express from 'express';
import { authenticate, schemaValidation, isAdmin, hasValidObjectId } from '../helpers/middleware';
import addPlanSchema from '../schemas/paymentPlan.schema';
import PaymentPlanController from '../controllers/paymentPlan.controllers';

const router = express.Router();

/**
 * @swagger
 * /payment/add:
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
  schemaValidation(addPlanSchema),
  PaymentPlanController.add,
);

/**
 * @swagger
 * /payment/all:
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
 * /payment/delete/:id:
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

module.exports = router;
