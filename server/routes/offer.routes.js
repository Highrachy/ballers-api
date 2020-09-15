import express from 'express';
import { authenticate, schemaValidation, isAdmin, hasValidObjectId } from '../helpers/middleware';
import { createOfferSchema, acceptOfferSchema, assignOfferSchema } from '../schemas/offer.schema';
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
  isAdmin,
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
  isAdmin,
  schemaValidation(assignOfferSchema),
  OfferController.assign,
);

/**
 * @swagger
 * /offer/user/all:
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
router.get('/user/all', authenticate, OfferController.getAllUserOffers);

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
router.get('/user/:id', authenticate, isAdmin, hasValidObjectId, OfferController.getAllAdminOffers);

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
router.get('/:id', authenticate, hasValidObjectId, OfferController.getOne);

module.exports = router;
