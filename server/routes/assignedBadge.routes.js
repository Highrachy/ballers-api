import express from 'express';
import assignBadgeSchema from '../schemas/assignedBadge.schema';
import {
  schemaValidation,
  authenticate,
  isAdmin,
  isAdminOrUserOrVendor,
  hasValidObjectId,
} from '../helpers/middleware';
import AssignedBadgeController from '../controllers/assignedBadge.controllers';

const router = express.Router();

/**
 * @swagger
 * /assign-badge:
 *   post:
 *     tags:
 *       - AssignedBadge
 *     description: Allows admin assign a badge
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/AssignedBadge'
 *      description: Allows admin assign a badge
 *     responses:
 *      '201':
 *        description: Badge assigned successfully
 *      '400':
 *        description: Error assigning Badge
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  schemaValidation(assignBadgeSchema),
  AssignedBadgeController.assignBadge,
);

/**
 * @swagger
 * /assign-badge/:id:
 *   delete:
 *     tags:
 *       - AssignedBadge
 *     description: Deletes specific assigned badge
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/AssignedBadge'
 *      description: Deletes specific assigned badge
 *     responses:
 *      '200':
 *        description: Badge deleted
 *      '500':
 *       description: Internal server error
 */
router.delete(
  '/:id',
  authenticate,
  hasValidObjectId,
  isAdmin,
  AssignedBadgeController.deleteAssignedBadge,
);

/**
 * @swagger
 * /assign-badge/all:
 *   get:
 *     tags:
 *       - AssignedBadge
 *     description: Get all assigned badges in db
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/AssignedBadge'
 *      description: Get all assigned badges in db
 *     responses:
 *      '200':
 *        description: returns badges
 *      '500':
 *       description: Internal server error
 */
router.get(
  '/all',
  authenticate,
  isAdminOrUserOrVendor,
  AssignedBadgeController.getAllAssignedBadges,
);

/**
 * @swagger
 * path:
 *  /assign-badge/:id:
 *    get:
 *      parameters:
 *        - in: query
 *          name: token
 *          schema:
 *            type: string
 *      summary: Get an assigned badge by its id
 *      tags: [AssignedBadge]
 *      responses:
 *        '200':
 *          description: Assigned badge found
 *        '404':
 *          description: Assigned badge not found
 *        '500':
 *          description: Internal server error
 */
router.get(
  '/:id',
  authenticate,
  hasValidObjectId,
  isAdminOrUserOrVendor,
  AssignedBadgeController.getAssignedBadge,
);

module.exports = router;
