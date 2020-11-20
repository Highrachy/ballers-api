import express from 'express';
import { addAreaSchema, updateAreaSchema } from '../schemas/area.schema';
import {
  schemaValidation,
  authenticate,
  isEditorOrAdmin,
  hasValidObjectId,
} from '../helpers/middleware';
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
 * /area/states:
 *   get:
 *     tags:
 *       - Area
 *     description: Get all states
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Area'
 *      description: Get all states
 *     responses:
 *      '200':
 *        description: returns states
 *      '500':
 *       description: Internal server error
 */
router.get('/states', authenticate, isEditorOrAdmin, AreaController.getStates);

/**
 * @swagger
 * /area/:state:
 *   get:
 *     tags:
 *       - Area
 *     description: Get all areas based on query parameters
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Area'
 *      description: Get all areas based on query parameters
 *     responses:
 *      '200':
 *        description: returns areas
 *      '500':
 *       description: Internal server error
 */
router.get('/:state', authenticate, isEditorOrAdmin, AreaController.getAreas);

/**
 * @swagger
 * /area/update:
 *   put:
 *     tags:
 *       - Area
 *     description: Updates existing area
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Area'
 *      description: Updates existing area
 *     responses:
 *      '200':
 *        description: Area updated
 *      '400':
 *        description: Error updating area
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/update',
  authenticate,
  isEditorOrAdmin,
  schemaValidation(updateAreaSchema),
  AreaController.update,
);

/**
 * @swagger
 * /area/delete/:id:
 *   delete:
 *     tags:
 *       - Area
 *     description: Deletes specific area
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Area'
 *      description: Deletes specific area
 *     responses:
 *      '200':
 *        description: Area deleted
 *      '500':
 *       description: Internal server error
 */
router.delete(
  '/delete/:id',
  authenticate,
  hasValidObjectId,
  isEditorOrAdmin,
  AreaController.delete,
);

/**
 * @swagger
 * /area/:
 *   get:
 *     tags:
 *       - Area
 *     description: Get all areas in db with their properties info
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Area'
 *      description: Get all areas in db with their properties info
 *     responses:
 *      '200':
 *        description: returns areas
 *      '500':
 *       description: Internal server error
 */
router.get('/', authenticate, isEditorOrAdmin, AreaController.getAllAreas);

module.exports = router;
