import express from 'express';
import {
  addOfflinePaymentSchema,
  updateOfflinePaymentSchema,
  commentSchema,
  resolveCommentSchema,
} from '../schemas/offlinePayment.schema';
import {
  schemaValidation,
  authenticate,
  isUser,
  isAdmin,
  hasValidObjectId,
  isUserOrAdmin,
} from '../helpers/middleware';
import OfflinePaymentController from '../controllers/offlinePayment.controllers';

const router = express.Router();

/**
 * @swagger
 * /offline-payment:
 *   post:
 *     tags:
 *       - OfflinePayment
 *     description: Allows a user add an offline payment
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/OfflinePayment'
 *      description: Allows a user add an offline payment
 *     responses:
 *      '201':
 *        description: Offline payment added successfully
 *      '400':
 *        description: Error adding offline payment
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/',
  authenticate,
  isUser,
  schemaValidation(addOfflinePaymentSchema),
  OfflinePaymentController.add,
);

/**
 * @swagger
 * /offline-payment/:
 *   put:
 *     tags:
 *       - OfflinePayment
 *     description: Allows a user edit an offline payment
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/OfflinePayment'
 *      description: Allows a user edit an offline payment
 *     responses:
 *      '200':
 *        description: Offline payment resolved
 *      '400':
 *        description: Error updating offline payment
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/',
  authenticate,
  isUser,
  schemaValidation(updateOfflinePaymentSchema),
  OfflinePaymentController.update,
);

/**
 * @swagger
 * /offline-payment/all:
 *   get:
 *     tags:
 *       - OfflinePayment
 *     description: Get all offline payments in db with their offer info
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/OfflinePayment'
 *      description: Get all offline payments in db with their offer info
 *     responses:
 *      '200':
 *        description: returns offline payments
 *      '500':
 *       description: Internal server error
 */
router.get('/all', authenticate, isAdmin, OfflinePaymentController.getAll);

/**
 * @swagger
 * /offline-payment/resolve/:id:
 *   put:
 *     tags:
 *       - OfflinePayment
 *     description: Resolves an offline payment
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/OfflinePayment'
 *      description: Resolves an offline payment
 *     responses:
 *      '200':
 *        description: Offline payment resolved
 *      '400':
 *        description: Error resolving offline payment
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/resolve/:id',
  authenticate,
  hasValidObjectId,
  isAdmin,
  OfflinePaymentController.resolveOfflinePayment,
);

/**
 * @swagger
 * /offline-payment/comment:
 *   put:
 *     tags:
 *       - OfflinePayment
 *     description: Raise a comment for a particular offline payment
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/OfflinePayment'
 *      description: Raise a comment for a particular offline payment
 *     responses:
 *      '200':
 *        description: Comment raised
 *      '400':
 *        description: Error raising comment
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/comment',
  authenticate,
  isUserOrAdmin,
  schemaValidation(commentSchema),
  OfflinePaymentController.makeComment,
);

/**
 * @swagger
 * /offline-payment/resolve-comment:
 *   put:
 *     tags:
 *       - OfflinePayment
 *     description: Respond to a comment for a particular offline payment
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/OfflinePayment'
 *      description: Respond to a comment for a particular offline payment
 *     responses:
 *      '200':
 *        description: Comment resolved
 *      '400':
 *        description: Error resolving comment
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/resolve-comment',
  authenticate,
  isUserOrAdmin,
  schemaValidation(resolveCommentSchema),
  OfflinePaymentController.resolveComment,
);

module.exports = router;
