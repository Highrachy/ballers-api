import express from 'express';
import { authenticate, schemaValidation, isAdmin } from '../helpers/middleware';
import { addEnquirySchema, approveEnquirySchema } from '../schemas/enquiry.schema';
import EnquiryController from '../controllers/enquiry.controllers';

const router = express.Router();

/**
 * @swagger
 * /enquiry/add:
 *   post:
 *     tags:
 *       - Enquiry
 *     description: Adds a new enquiry
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Enquiry'
 *      description: Add a new enquiry
 *     responses:
 *      '201':
 *        description: Enquiry added
 *      '400':
 *        description: Error adding enquiry
 *      '500':
 *       description: Internal server error
 */
router.post('/add', authenticate, schemaValidation(addEnquirySchema), EnquiryController.add);

/**
 * @swagger
 * /enquiry/approve:
 *   put:
 *     tags:
 *       - Enquiry
 *     description: Approves a specific enquiry
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Enquiry'
 *      description: Approves a specific enquiry
 *     responses:
 *      '200':
 *        description: Enquiry approved
 *      '400':
 *        description: Error approving enquiry
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/approve',
  authenticate,
  isAdmin,
  schemaValidation(approveEnquirySchema),
  EnquiryController.approve,
);

/**
 * @swagger
 * /enquiry/all:
 *   get:
 *     tags:
 *       - Enquiry
 *     description: Get all enquiries
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Enquiry'
 *      description: Get all owned enquiries
 *     responses:
 *      '200':
 *        description: returns object of enquiries
 *      '500':
 *       description: Internal server error
 */
router.get('/all', authenticate, isAdmin, EnquiryController.getAll);

module.exports = router;
