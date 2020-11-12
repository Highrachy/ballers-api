import express from 'express';
import addContentPropertySchema from '../schemas/contentProperty.schema';
import { schemaValidation, authenticate, isEditorOrAdmin } from '../helpers/middleware';
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
 *        description: Property added successfully
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

module.exports = router;
