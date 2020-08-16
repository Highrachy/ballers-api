import express from 'express';
import { authenticate, schemaValidation, isAdmin, hasValidObjectId } from '../helpers/middleware';
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
router.delete('/delete/:id', authenticate, hasValidObjectId, isAdmin, PropertyController.delete);

/**
 * @swagger
 * path:
 *  /property/added-by/:id:
 *    get:
 *      parameters:
 *        - in: query
 *          name: token
 *          schema:
 *            type: string
 *          description: the auto generated user token via jwt
 *      summary: Gets all properties added by an admin(ID)
 *      tags: [Property]
 *      responses:
 *        '200':
 *          description: Properties found
 *        '500':
 *          description: Internal server error
 */
router.get(
  '/added-by/:id',
  authenticate,
  hasValidObjectId,
  isAdmin,
  PropertyController.getAllPropertiesAddedByAnAdmin,
);

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
 *      description: Get all properties in DB
 *     responses:
 *      '200':
 *        description: returns object of properties
 *      '500':
 *       description: Internal server error
 */
router.get('/all', authenticate, isAdmin, PropertyController.getAllProperties);

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
 *      summary: Gets a property based by its ID
 *      tags: [Property]
 *      responses:
 *        '200':
 *          description: Property found
 *        '500':
 *          description: Internal server error
 */
router.get('/:id', authenticate, hasValidObjectId, PropertyController.getOneProperty);

module.exports = router;
