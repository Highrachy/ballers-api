import express from 'express';
import propertyVisitationSchema from '../schemas/visitation.schema';
import { schemaValidation, authenticate } from '../helpers/middleware';
import VisitationController from '../controllers/visitation.controllers';

const router = express.Router();

/**
 * @swagger
 * visitation/schedule:
 *   post:
 *     tags:
 *       - Visitation
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
  '/schedule',
  authenticate,
  schemaValidation(propertyVisitationSchema),
  VisitationController.book,
);

module.exports = router;
