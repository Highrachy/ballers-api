import express from 'express';
import addAreaSchema from '../schemas/area.schema';
import { schemaValidation, authenticate, isEditor } from '../helpers/middleware';
import AreaController from '../controllers/area.controllers';

const router = express.Router();

/**
 * @swagger
 * area/add:
 *   post:
 *     tags:
 *       - Area
 *     description: Allows content editor add an area
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Visit'
 *      description: Allows content editor add an area
 *     responses:
 *      '201':
 *        description: Area added successfully
 *      '400':
 *        description: Error adding area
 *      '500':
 *       description: Internal server error
 */
router.post('/add', authenticate, isEditor, schemaValidation(addAreaSchema), AreaController.add);

module.exports = router;
