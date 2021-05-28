import express from 'express';
import {
  authenticate,
  schemaValidation,
  isAdmin,
  isVendor,
  isVendorOrAdmin,
  hasValidObjectId,
  isAdminOrUserOrVendor,
} from '../helpers/middleware';
import {
  addPropertySchema,
  updatePropertySchema,
  updateNeighborhoodSchema,
  addNeighborhoodSchema,
  deleteNeighborhoodSchema,
  addFloorplanSchema,
  updateFloorplanSchema,
  deleteFloorplanSchema,
  addImageSchema,
  updateGallerySchema,
  deleteImageSchema,
  flagPropertySchema,
  unflagPropertySchema,
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
 *   get:
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
 *      '200':
 *        description: returns object of properties
 *      '500':
 *       description: Internal server error
 */
router.get('/search', authenticate, PropertyController.search);

/**
 * @swagger
 * /property/available-options:
 *   get:
 *     tags:
 *       - Property
 *     description: Get distinct state and house types of all properties
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Property'
 *      description: Get distinct state and house types of all properties
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
 *  /property/portfolio/all:
 *    get:
 *      parameters:
 *        - in: query
 *          name: token
 *          schema:
 *            type: string
 *          description: verifies user access
 *      summary: Gets all properties in a user's portfolio
 *      tags: [Property]
 *      responses:
 *        '200':
 *          description: Properties found
 *        '500':
 *          description: Internal server error
 */
router.get(
  '/portfolio/all',
  authenticate,
  isAdminOrUserOrVendor,
  PropertyController.getAllPortfolios,
);

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
 * /property/:id/neighborhood:
 *   post:
 *     tags:
 *       - Property
 *     description: Adds to a property's neighborhood
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Property'
 *      description: Adds to a property's neighborhood
 *     responses:
 *      '200':
 *        description: Neigborhood added
 *      '404':
 *        description: Property not found
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/:id/neighborhood',
  authenticate,
  hasValidObjectId,
  isVendor,
  schemaValidation(addNeighborhoodSchema),
  PropertyController.addNeighborhood,
);

/**
 * @swagger
 * /property/:id/neighborhood:
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
  '/:id/neighborhood',
  authenticate,
  hasValidObjectId,
  isVendor,
  schemaValidation(updateNeighborhoodSchema),
  PropertyController.updateNeighborhood,
);

/**
 * @swagger
 * /property/:id/neighborhood:
 *   delete:
 *     tags:
 *       - Property
 *     description: Deletes from a property's neigborhood
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Property'
 *      description: Deletes from a property's neigborhood
 *     responses:
 *      '200':
 *        description: Neighborhood deleted
 *      '500':
 *       description: Internal server error
 */
router.delete(
  '/:id/neighborhood',
  authenticate,
  hasValidObjectId,
  isVendor,
  schemaValidation(deleteNeighborhoodSchema),
  PropertyController.deleteNeighborhood,
);

/**
 * @swagger
 * /property/:id/floorplan:
 *   post:
 *     tags:
 *       - Property
 *     description: Adds to a property's floorplan
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Property'
 *      description: Adds to a property's floorplan
 *     responses:
 *      '200':
 *        description: Floorplan added
 *      '404':
 *        description: Property not found
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/:id/floorplan',
  authenticate,
  hasValidObjectId,
  isVendor,
  schemaValidation(addFloorplanSchema),
  PropertyController.addFloorPlan,
);

/**
 * @swagger
 * /property/:id/floorplan:
 *   put:
 *     tags:
 *       - Property
 *     description: Updates existing property floorplan
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Property'
 *      description: Updates existing property floorplan
 *     responses:
 *      '200':
 *        description: Floorplan updated
 *      '400':
 *        description: Error updating floorplan
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/:id/floorplan',
  authenticate,
  hasValidObjectId,
  isVendor,
  schemaValidation(updateFloorplanSchema),
  PropertyController.updateFloorPlan,
);

/**
 * @swagger
 * /property/:id/floorplan:
 *   delete:
 *     tags:
 *       - Property
 *     description: Deletes from a property's floorplan
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Property'
 *      description: Deletes from a property's floorplan
 *     responses:
 *      '200':
 *        description: Floorplan deleted
 *      '500':
 *       description: Internal server error
 */
router.delete(
  '/:id/floorplan',
  authenticate,
  hasValidObjectId,
  isVendor,
  schemaValidation(deleteFloorplanSchema),
  PropertyController.deleteFloorPlan,
);

/**
 * @swagger
 * /property/:id/gallery:
 *   post:
 *     tags:
 *       - Property
 *     description: Adds an image to a property's gallery
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Property'
 *      description: Adds an image to a property's gallery
 *     responses:
 *      '200':
 *        description: Image added
 *      '404':
 *        description: Property not found
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/:id/gallery',
  authenticate,
  hasValidObjectId,
  isVendor,
  schemaValidation(addImageSchema),
  PropertyController.addGallery,
);

/**
 * @swagger
 * /property/:id/gallery:
 *   put:
 *     tags:
 *       - Property
 *     description: Updates an image in a property's gallery
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Property'
 *      description: Updates an image in a property's gallery
 *     responses:
 *      '200':
 *        description: Image updated
 *      '400':
 *        description: Error updating image
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/:id/gallery',
  authenticate,
  hasValidObjectId,
  isVendor,
  schemaValidation(updateGallerySchema),
  PropertyController.updateGallery,
);

/**
 * @swagger
 * /property/:id/gallery:
 *   delete:
 *     tags:
 *       - Property
 *     description: Deletes an image from a property's gallery
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Property'
 *      description: Deletes an image from a property's gallery
 *     responses:
 *      '200':
 *        description: Image deleted
 *      '500':
 *       description: Internal server error
 */
router.delete(
  '/:id/gallery',
  authenticate,
  hasValidObjectId,
  isVendor,
  schemaValidation(deleteImageSchema),
  PropertyController.deleteGallery,
);

/**
 * @swagger
 * /property/flag:
 *   put:
 *     tags:
 *       - Property
 *     description: Allows an admin to flag a property
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Property'
 *      description: Allows an admin to flag a property
 *     responses:
 *      '200':
 *        description: Property flagged
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/flag',
  authenticate,
  isAdmin,
  schemaValidation(flagPropertySchema),
  PropertyController.flagProperty,
);

/**
 * @swagger
 * /property/unflag:
 *   put:
 *     tags:
 *       - Property
 *     description: Allows an admin to unflag a flagged property
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Property'
 *      description: Allows an admin to unflag a flagged property
 *     responses:
 *      '200':
 *        description: Property unflagged
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/unflag',
  authenticate,
  isAdmin,
  schemaValidation(unflagPropertySchema),
  PropertyController.unflagProperty,
);

/**
 * @swagger
 * path:
 *  /property/portfolio/:id:
 *    get:
 *      parameters:
 *        - in: query
 *          name: token
 *          schema:
 *            type: string
 *          description: verifies user access
 *      summary: Get details of a property in portfolio based by its offer id
 *      tags: [Property]
 *      responses:
 *        '200':
 *          description: Property found
 *        '500':
 *          description: Internal server error
 */
router.get(
  '/portfolio/:id',
  hasValidObjectId,
  authenticate,
  isAdminOrUserOrVendor,
  PropertyController.getOnePortfolio,
);

/**
 * @swagger
 * /property/approve/:id:
 *   put:
 *     tags:
 *       - Property
 *     description: Approve a property for viewing
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Property'
 *      description: Approve a property for viewing
 *     responses:
 *      '200':
 *        description: Property approved
 *      '404':
 *       description: Property not found
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/approve/:id',
  authenticate,
  hasValidObjectId,
  isAdmin,
  PropertyController.approveProperty,
);

module.exports = router;
