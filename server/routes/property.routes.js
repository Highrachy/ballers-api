import express from 'express';
import { authenticate, schemaValidation, isAdmin } from '../helpers/middleware';
import { addPropertySchema, updatePropertySchema } from '../schemas/property.schema';
import PropertyController from '../controllers/property.controllers';

const router = express.Router();

/**
 * @swagger
 * /property/add:
 *   post:
 *     tags:
 *       - Property
 *     description: Adds a new property
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Property'
 *      description: Add a new property
 *     responses:
 *      '201':
 *        description: Property added
 *      '400':
 *        description: Error adding property
 *      '412':
 *        description: Property already exists
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/add',
  authenticate,
  isAdmin,
  schemaValidation(addPropertySchema),
  PropertyController.add,
);

/**
 * @swagger
 * /property/update:
 *   put:
 *     tags:
 *       - Property
 *     description: Updates existing property
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Property'
 *      description: Updates existing property
 *     responses:
 *      '200':
 *        description: Property updated
 *      '400':
 *        description: Error updating property
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/update',
  authenticate,
  isAdmin,
  schemaValidation(updatePropertySchema),
  PropertyController.update,
);

/**
 * @swagger
 * /property/delete/:id:
 *   delete:
 *     tags:
 *       - Property
 *     description: Deletes specific property
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Property'
 *      description: Deletes specific property
 *     responses:
 *      '200':
 *        description: Property deleted
 *      '500':
 *       description: Internal server error
 */
router.delete('/delete/:id', authenticate, isAdmin, PropertyController.delete);

/**
 * @swagger
 * /property/all:
 *   get:
 *     tags:
 *       - Property
 *     description: Get all properties
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Property'
 *      description: Get all owned properties
 *     responses:
 *      '200':
 *        description: returns object of properties
 *      '404':
 *        description: No properties available
 *      '500':
 *       description: Internal server error
 */
router.get('/all', authenticate, isAdmin, PropertyController.getMultiple);

/**
 * @swagger
 * path:
 *  /property/:id:
 *    get:
 *      parameters:
 *        - in: query
 *          name: token
 *          schema:
 *            type: string
 *          description: verifies user access
 *      tags: [Property]
 *      responses:
 *        '200':
 *          description: Gets specific property
 *        '404':
 *          description: Property does not exist
 *        '500':
 *          description: Internal server error
 */
router.get('/:id', authenticate, isAdmin, PropertyController.getOne);

module.exports = router;