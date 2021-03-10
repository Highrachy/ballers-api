import express from 'express';
import {
  reportPropertySchema,
  resolveReportedPropertySchema,
} from '../schemas/reportedProperty.schema';
import { schemaValidation, authenticate, isUser, isAdmin } from '../helpers/middleware';
import ReportedPropertyController from '../controllers/reportedProperty.controllers';

const router = express.Router();

/**
 * @swagger
 * /report-property/report:
 *   post:
 *     tags:
 *       - ReportedProperty
 *     description: Allows user report a property
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/ReportedProperty'
 *      description: Allows user report a property
 *     responses:
 *      '201':
 *        description: Property reported
 *      '400':
 *        description: Error reporting property
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/report',
  authenticate,
  isUser,
  schemaValidation(reportPropertySchema),
  ReportedPropertyController.report,
);

/**
 * @swagger
 * /report-property/resolve:
 *   put:
 *     tags:
 *       - ReportedProperty
 *     description: Resolves a reported case
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/ReportedProperty'
 *      description: Resolves a reported case
 *     responses:
 *      '200':
 *        description: Report resolved
 *      '400':
 *        description: Error resolving report
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/resolve',
  authenticate,
  isAdmin,
  schemaValidation(resolveReportedPropertySchema),
  ReportedPropertyController.resolve,
);

/**
 * @swagger
 * /report-property/all:
 *   get:
 *     tags:
 *       - ReportedProperty
 *     description: Get all reported properties
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/ReportedProperty'
 *      description: Get all reported properties
 *     responses:
 *      '200':
 *        description: returns reported properties
 *      '500':
 *       description: Internal server error
 */
router.get('/all', authenticate, isAdmin, ReportedPropertyController.getAll);

module.exports = router;
