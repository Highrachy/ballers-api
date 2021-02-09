import express from 'express';
import {
  propertyVisitationSchema,
  resolveVisitationSchema,
  rescheduleVisitationSchema,
} from '../schemas/visitation.schema';
import {
  schemaValidation,
  authenticate,
  isVendorOrAdmin,
  isUserOrVendor,
  isVendor,
} from '../helpers/middleware';
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

/**
 * @swagger
 * path:
 *  /visitation/all:
 *    get:
 *      parameters:
 *        - in: query
 *          name: token
 *          schema:
 *            type: string
 *          description: verifies user access
 *      tags: [Visitation]
 *      responses:
 *        '200':
 *          description: Gets all scheduled visitations
 *        '404':
 *          description: No scheduled visitation
 *        '500':
 *          description: Internal server error
 */
router.get('/all', authenticate, isVendorOrAdmin, VisitationController.getAll);

/**
 * @swagger
 * /visitation/resolve:
 *   put:
 *     tags:
 *       - User
 *     description: Allows a vendor resolve a completed visitation
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              visitationId:
 *                  type: string
 *     responses:
 *      '200':
 *        description: Visitation resolved
 *      '404':
 *        description: Visitation not found
 *      '400':
 *        description: Bad request
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/resolve',
  authenticate,
  isVendor,
  schemaValidation(resolveVisitationSchema),
  VisitationController.resolveVisitation,
);

/**
 * @swagger
 * /visitation/reschedule:
 *   put:
 *     tags:
 *       - User
 *     description: Allows a vendor or a user reschedule a visitation
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              visitationId:
 *                  type: string
 *              step:
 *                  type: string
 *     responses:
 *      '200':
 *        description: Visitation resolved
 *      '404':
 *        description: Visitation not found
 *      '400':
 *        description: Bad request
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/reschedule',
  authenticate,
  isUserOrVendor,
  schemaValidation(rescheduleVisitationSchema),
  VisitationController.rescheduleVisitation,
);

module.exports = router;
