import express from 'express';
import {
  authenticate,
  schemaValidation,
  isVendor,
  hasValidObjectId,
  isAdminOrUserOrVendor,
} from '../helpers/middleware';
import {
  createOfferSchema,
  acceptOfferSchema,
  validateOfferIdSchema,
  raiseConcernSchema,
  resolveConcernSchema,
  reactivateOfferSchema,
} from '../schemas/offer.schema';
import OfferController from '../controllers/offer.controllers';

const router = express.Router();

/**
 * @swagger
 * /offer/create:
 *   post:
 *     tags:
 *       - Offer
 *     description: Creates a new offer
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Offer'
 *      description: Add a new offer
 *     responses:
 *      '201':
 *        description: Offer created
 *      '400':
 *        description: Error creating offer
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/create',
  authenticate,
  isVendor,
  schemaValidation(createOfferSchema),
  OfferController.create,
);

/**
 * @swagger
 * /offer/accept:
 *   put:
 *     tags:
 *       - Offer
 *     description: Accepts a specific offer
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Offer'
 *      description: Respond to a specific offer
 *     responses:
 *      '200':
 *        description: Offer accepted
 *      '400':
 *        description: Error accepting to offer
 *      '500':
 *       description: Internal server error
 */
router.put('/accept', authenticate, schemaValidation(acceptOfferSchema), OfferController.accept);

/**
 * @swagger
 * /offer/cancel:
 *   put:
 *     tags:
 *       - Offer
 *     description: Cancel a specific offer
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Offer'
 *      description: Respond to a specific offer
 *     responses:
 *      '200':
 *        description: Offer cancelled
 *      '400':
 *        description: Error cancelling offer
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/cancel',
  authenticate,
  isVendor,
  schemaValidation(validateOfferIdSchema),
  OfferController.cancel,
);

/**
 * @swagger
 * /offer/assign:
 *   put:
 *     tags:
 *       - Offer
 *     description: Assigns a specific offer to a user
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Offer'
 *      description: Assigns a specific offer to a user
 *     responses:
 *      '200':
 *        description: Offer assigned
 *      '400':
 *        description: Error assigning offer
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/assign',
  authenticate,
  isVendor,
  schemaValidation(validateOfferIdSchema),
  OfferController.assign,
);

/**
 * @swagger
 * /offer/raise-concern:
 *   put:
 *     tags:
 *       - Offer
 *     description: Raise a concern for a particular offer
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Offer'
 *      description: Raise a concern for a particular offer
 *     responses:
 *      '200':
 *        description: Concern raised
 *      '400':
 *        description: Error raising concern
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/raise-concern',
  authenticate,
  schemaValidation(raiseConcernSchema),
  OfferController.raiseConcern,
);

/**
 * @swagger
 * /offer/resolve-concern:
 *   put:
 *     tags:
 *       - Offer
 *     description: Resolve a concern for a particular offer
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Offer'
 *      description: Resolve a concern for a particular offer
 *     responses:
 *      '200':
 *        description: Concern resolved
 *      '400':
 *        description: Error resolving concern
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/resolve-concern',
  authenticate,
  isVendor,
  schemaValidation(resolveConcernSchema),
  OfferController.resolveConcern,
);

/**
 * @swagger
 * /offer/all:
 *   get:
 *     tags:
 *       - Offer
 *     description: Get all owned offers
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Offer'
 *      description: Get all owned offers
 *     responses:
 *      '200':
 *        description: returns object of offers
 *      '500':
 *       description: Internal server error
 */
router.get('/all', authenticate, isAdminOrUserOrVendor, OfferController.getAllOffers);

/**
 * @swagger
 * /offer/user/:id:
 *   get:
 *     tags:
 *       - Offer
 *     description: Get all offers of a user
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Offer'
 *      description: Get all offers of a user
 *     responses:
 *      '200':
 *        description: returns object of offers
 *      '500':
 *       description: Internal server error
 */
router.get(
  '/user/:id',
  authenticate,
  isAdminOrUserOrVendor,
  hasValidObjectId,
  OfferController.getAllUserOffers,
);

/**
 * @swagger
 * /offer/active:
 *   get:
 *     tags:
 *       - Offer
 *     description: Get all active owned offers
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Offer'
 *      description: Get all active owned offers
 *     responses:
 *      '200':
 *        description: returns object of offers
 *      '500':
 *       description: Internal server error
 */
router.get('/active', authenticate, OfferController.getAllActive);

/**
 * @swagger
 * path:
 *  /offer/:id:
 *    get:
 *      parameters:
 *        - in: query
 *          name: token
 *          schema:
 *            type: string
 *          description: verifies user access
 *      summary: Gets an offer based by its ID
 *      tags: [Offer]
 *      responses:
 *        '200':
 *          description: Offer found
 *        '500':
 *          description: Internal server error
 */
router.get('/:id', authenticate, isAdminOrUserOrVendor, hasValidObjectId, OfferController.getOne);

/**
 * @swagger
 * /offer/reactivate:
 *   put:
 *     tags:
 *       - Offer
 *     description: Reactivates an expired offer
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Offer'
 *      description: Reactivates an expired offer
 *     responses:
 *      '201':
 *        description: Offer reactivated
 *      '400':
 *        description: Error reactivating offer
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/reactivate',
  authenticate,
  isVendor,
  schemaValidation(reactivateOfferSchema),
  OfferController.reactivateOffer,
);

module.exports = router;
