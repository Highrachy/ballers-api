import express from 'express';
import {
  authenticate,
  schemaValidation,
  isAdmin,
  isVendor,
  isVendorOrAdmin,
  hasValidObjectId,
} from '../helpers/middleware';
import {
  addPropertySchema,
  updatePropertySchema,
  searchPropertySchema,
  updateNeighborhoodSchema,
} from '../schemas/property.schema';
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
  isVendor,
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
  isVendor,
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
router.delete(
  '/delete/:id',
  authenticate,
  hasValidObjectId,
  isVendorOrAdmin,
  PropertyController.delete,
);

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
  PropertyController.getAllPropertiesAddedByVendor,
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
router.get('/all', authenticate, isVendorOrAdmin, PropertyController.getAllProperties);

/**
 * @swagger
 * /property/search:
 *   post:
 *     tags:
 *       - Property
 *     description: Search for properties based on state, area & location
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Property'
 *      description: Search for properties based on state, area & location
 *     responses:
 *      '201':
 *        description: Properties found
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/search',
  authenticate,
  schemaValidation(searchPropertySchema),
  PropertyController.search,
);

/**
 * @swagger
 * /property/available-options:
 *   get:
 *     tags:
 *       - Property
 *     description: Get distince state and house types of all properties
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Property'
 *      description: Get distince state and house types of all properties
 *     responses:
 *      '200':
 *        description: returns object of available fields
 *      '500':
 *       description: Internal server error
 */
router.get('/available-options', authenticate, PropertyController.getDistinctPropertyOptions);

/**
 * @swagger
 * path:
 *  /property/assigned/:id:
 *    get:
 *      parameters:
 *        - in: query
 *          name: token
 *          schema:
 *            type: string
 *          description: verifies user access
 *      summary: Gets all information and transaction summ of assigned property by offer ID
 *      tags: [Property]
 *      responses:
 *        '200':
 *          description: Properties found
 *        '500':
 *          description: Internal server error
 */
router.get(
  '/assigned/:id',
  authenticate,
  hasValidObjectId,
  PropertyController.getAssignedPropertyByOfferId,
);

/**
 * @swagger
 * path:
 *  /property/assigned/:
 *    get:
 *      parameters:
 *        - in: query
 *          name: token
 *          schema:
 *            type: string
 *          description: verifies user access
 *      summary: Gets all properties assigned to a user
 *      tags: [Property]
 *      responses:
 *        '200':
 *          description: Properties found
 *        '500':
 *          description: Internal server error
 */
router.get('/assigned/', authenticate, PropertyController.getAssignedProperties);

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

/**
 * @swagger
 * /property/neighborhood/update:
 *   put:
 *     tags:
 *       - Property
 *     description: Updates existing property neighborhood
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Property'
 *      description: Updates existing property neighborhood
 *     responses:
 *      '200':
 *        description: Neighborhood updated
 *      '400':
 *        description: Error updating neighborhood
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/neighborhood/update',
  authenticate,
  isVendor,
  schemaValidation(updateNeighborhoodSchema),
  PropertyController.updateNeighborhood,
);

module.exports = router;
