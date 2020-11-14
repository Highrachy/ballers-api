import express from 'express';
import addAreaSchema from '../schemas/area.schema';
import { schemaValidation, authenticate, isEditorOrAdmin } from '../helpers/middleware';
import AreaController from '../controllers/area.controllers';

const router = express.Router();

/**
 * @swagger
 * /area/add:
 *   post:
 *     tags:
 *       - Area
 *     description: Allows content editor or admin add an area
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Area'
 *      description: Allows content editor or admin add an area
 *     responses:
 *      '201':
 *        description: Area added successfully
 *      '400':
 *        description: Error adding area
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/add',
  authenticate,
  isEditorOrAdmin,
  schemaValidation(addAreaSchema),
  AreaController.add,
);

/**
 * @swagger
 * /area/:
 *   get:
 *     tags:
 *       - Area
 *     description: Get all states and areas based on query parameters
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Area'
 *      description: Get all states and areas based on query parameters
 *     responses:
 *      '200':
 *        description: returns states or areas
 *      '500':
 *       description: Internal server error
 */
router.get('/', authenticate, isEditorOrAdmin, AreaController.search);

module.exports = router;
