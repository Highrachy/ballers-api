import express from 'express';
import { authenticate, schemaValidation, isAdmin, hasValidObjectId } from '../helpers/middleware';
import {
  createOfferSchema,
  acceptOfferSchema,
  assignOfferSchema,
} from '../schemas/offerLetter.schema';
import OfferLetterController from '../controllers/offerLetter.controllers';

const router = express.Router();

/**
 * @swagger
 * /offer/create:
 *   post:
 *     tags:
 *       - OfferLetter
 *     description: Creates a new offer
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/OfferLetter'
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
  OfferLetterController.create,
);

/**
 * @swagger
 * /offer/respond:
 *   put:
 *     tags:
 *       - OfferLetter
 *     description: Respond to a specific offer
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/OfferLetter'
 *      description: Respond to a specific offer
 *     responses:
 *      '200':
 *        description: Offer rsponded to
 *      '400':
 *        description: Error responding to offer
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/respond',
  authenticate,
  schemaValidation(acceptOfferSchema),
  OfferLetterController.respond,
);

/**
 * @swagger
 * /offer/assign:
 *   put:
 *     tags:
 *       - OfferLetter
 *     description: Assigns a specific offer to a user
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/OfferLetter'
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
  OfferLetterController.assign,
);

/**
 * @swagger
 * /offer/all:
 *   get:
 *     tags:
 *       - OfferLetter
 *     description: Get all offers
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/OfferLetter'
 *      description: Get all owned offers
 *     responses:
 *      '200':
 *        description: returns object of offers
 *      '500':
 *       description: Internal server error
 */
router.get('/all', authenticate, isAdmin, OfferLetterController.getAll);

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
 *      tags: [OfferLetter]
 *      responses:
 *        '200':
 *          description: Offer found
 *        '500':
 *          description: Internal server error
 */
router.get('/:id', authenticate, isAdmin, hasValidObjectId, OfferLetterController.getOne);

module.exports = router;
