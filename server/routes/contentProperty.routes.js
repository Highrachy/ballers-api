import express from 'express';
import {
  addContentPropertySchema,
  updateContentPropertySchema,
} from '../schemas/contentProperty.schema';
import {
  schemaValidation,
  authenticate,
  isEditorOrAdmin,
  hasValidObjectId,
} from '../helpers/middleware';
import ContentPropertyController from '../controllers/contentProperty.controllers';

const router = express.Router();

/**
 * @swagger
 * /content-property/add:
 *   post:
 *     tags:
 *       - ContentProperty
 *     description: Allows content editor or admin add a property
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/ContentProperty'
 *      description: Allows content editor or admin add a property
 *     responses:
 *      '201':
 *        description: Content Property added successfully
 *      '400':
 *        description: Error adding property
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/add',
  authenticate,
  isEditorOrAdmin,
  schemaValidation(addContentPropertySchema),
  ContentPropertyController.add,
);

/**
 * @swagger
 * /content-property/update:
 *   put:
 *     tags:
 *       - ContentProperty
 *     description: Updates existing content property
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/ContentProperty'
 *      description: Updates existing content property
 *     responses:
 *      '200':
 *        description: Content property updated
 *      '400':
 *        description: Error updating content property
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/update',
  authenticate,
  isEditorOrAdmin,
  schemaValidation(updateContentPropertySchema),
  ContentPropertyController.update,
);

/**
 * @swagger
 * /content-property/delete/:id:
 *   delete:
 *     tags:
 *       - ContentProperty
 *     description: Deletes specific content property
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/ContentProperty'
 *      description: Deletes specific content property
 *     responses:
 *      '200':
 *        description: Content property deleted
 *      '500':
 *       description: Internal server error
 */
router.delete(
  '/delete/:id',
  authenticate,
  hasValidObjectId,
  isEditorOrAdmin,
  ContentPropertyController.delete,
);

/**
 * @swagger
 * /content-property/area/:id:
 *   get:
 *     tags:
 *       - ContentProperty
 *     description: Get all house types based on the area id
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/ContentProperty'
 *      description:  Get all house types based on the area id
 *     responses:
 *      '200':
 *        description: returns house types
 *      '500':
 *       description: Internal server error
 */
router.get('/area/:id', hasValidObjectId, ContentPropertyController.getHouseTypesByAreaId);

/**
 * @swagger
 * /content-property/:
 *   get:
 *     tags:
 *       - ContentProperty
 *     description: Get related content properties based on search parameters
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/ContentProperty'
 *      description:  Get related content properties based on search parameters
 *     responses:
 *      '200':
 *        description: returns related content properties
 *      '500':
 *       description: Internal server error
 */
router.get('/', ContentPropertyController.search);

/**
 * @swagger
 * /content-property/all:
 *   get:
 *     tags:
 *       - ContentProperty
 *     description: Get all content properties
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/ContentProperty'
 *      description:  Get all content properties
 *     responses:
 *      '200':
 *        description: returns all content properties
 *      '500':
 *       description: Internal server error
 */
router.get(
  '/all',
  authenticate,
  isEditorOrAdmin,
  ContentPropertyController.getAllContentProperties,
);

module.exports = router;
