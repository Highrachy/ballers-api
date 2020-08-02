import express from 'express';
import propertyVisitationSchema from '../schemas/visit.schema';
import { schemaValidation, authenticate } from '../helpers/middleware';
import VisitController from '../controllers/visit.controllers';

const router = express.Router();

/**
 * @swagger
 * /visit/book:
 *   post:
 *     tags:
 *       - Visit
 *     description: Allows a visitor apply to visit a specific property
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Visit'
 *      description: Allows a visitor apply to visit a specific property
 *     responses:
 *      '201':
 *        description: Visit scheduled successfully
 *      '400':
 *        description: Error scheduling visit
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/book',
  authenticate,
  schemaValidation(propertyVisitationSchema),
  VisitController.book,
);

module.exports = router;
