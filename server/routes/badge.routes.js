import express from 'express';
import {
  addBadgeSchema,
  updateBadgeSchema,
  assignedRoleBadgeSchema,
} from '../schemas/badge.schema';
import {
  schemaValidation,
  authenticate,
  isAdmin,
  hasValidObjectId,
  parameterSchemaValidation,
} from '../helpers/middleware';
import BadgeController from '../controllers/badge.controllers';

const router = express.Router();

/**
 * @swagger
 * /badge:
 *   post:
 *     tags:
 *       - Badge
 *     description: Allows admin add a badge
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Badge'
 *      description: Allows admin add a badge
 *     responses:
 *      '201':
 *        description: Badge added successfully
 *      '400':
 *        description: Error adding Badge
 *      '500':
 *       description: Internal server error
 */
router.post('/', authenticate, isAdmin, schemaValidation(addBadgeSchema), BadgeController.addBadge);

/**
 * @swagger
 * /badge:
 *   put:
 *     tags:
 *       - Badge
 *     description: Updates existing Badge
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Badge'
 *      description: Updates existing badge
 *     responses:
 *      '200':
 *        description: Badge updated
 *      '400':
 *        description: Error updating badge
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/',
  authenticate,
  isAdmin,
  schemaValidation(updateBadgeSchema),
  BadgeController.updateBadge,
);

/**
 * @swagger
 * /badge/:id:
 *   delete:
 *     tags:
 *       - Badge
 *     description: Deletes specific badge
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Badge'
 *      description: Deletes specific badge
 *     responses:
 *      '200':
 *        description: Badge deleted
 *      '500':
 *       description: Internal server error
 */
router.delete('/:id', authenticate, hasValidObjectId, isAdmin, BadgeController.deleteBadge);

/**
 * @swagger
 * /badge/all:
 *   get:
 *     tags:
 *       - Badge
 *     description: Get all badges in db
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Badge'
 *      description: Get all badges in db
 *     responses:
 *      '200':
 *        description: returns badges
 *      '500':
 *       description: Internal server error
 */
router.get('/all', authenticate, isAdmin, BadgeController.getAllBadges);

/**
 * @swagger
 * path:
 *  /badge/:id:
 *    get:
 *      parameters:
 *        - in: query
 *          name: token
 *          schema:
 *            type: string
 *      summary: Get a badge by the badge id
 *      tags: [Badge]
 *      responses:
 *        '200':
 *          description: Badge found
 *        '404':
 *          description: Badge not found
 *        '500':
 *          description: Internal server error
 */
router.get('/:id', authenticate, hasValidObjectId, isAdmin, BadgeController.getOneBadge);

/**
 * @swagger
 * /badge/all/role/:role:
 *   get:
 *     tags:
 *       - Badge
 *     description: Returns all badges and role specific badge
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Badge'
 *      description: Returns all badges and role specific badge
 *     responses:
 *      '200':
 *        description: Badges returned
 *      '500':
 *       description: Internal server error
 */
router.get(
  '/all/role/:role',
  authenticate,
  isAdmin,
  parameterSchemaValidation(assignedRoleBadgeSchema),
  BadgeController.getRoleBasedBadges,
);

module.exports = router;
