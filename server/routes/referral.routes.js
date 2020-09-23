import express from 'express';
import { authenticate, schemaValidation, isAdmin, hasValidObjectId } from '../helpers/middleware';
import {
  updateReferralSchema,
  emailReferralSchema,
  sendReferralSchema,
} from '../schemas/referral.schema';
import ReferralController from '../controllers/referral.controllers';

const router = express.Router();

/**
 * @swagger
 * /referral/:
 *   get:
 *     tags:
 *       - Referral
 *     description: Get all owned referrals
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Referral'
 *      description: Get all owned referrals
 *     responses:
 *      '200':
 *        description: returns object of referrals
 *      '500':
 *       description: Internal server error
 */
router.get('/', authenticate, ReferralController.getUserReferrals);

/**
 * @swagger
 * /referral/all/:
 *   get:
 *     tags:
 *       - Referral
 *     description: Get all referrals
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Referral'
 *      description: Get all referrals
 *     responses:
 *      '200':
 *        description: returns object of referrals
 *      '500':
 *       description: Internal server error
 */
router.get('/all', authenticate, isAdmin, ReferralController.getAllReferrals);

/**
 * @swagger
 * /referral/rewarded:
 *   put:
 *     tags:
 *       - Referral
 *     description: Approves a specific referral
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Referral'
 *      description: Approves a specific referral
 *     responses:
 *      '200':
 *        description: Referral approved
 *      '400':
 *        description: Error approving referral
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/rewarded',
  authenticate,
  isAdmin,
  schemaValidation(updateReferralSchema),
  ReferralController.updateReferralToRewarded,
);

/**
 * @swagger
 * /referral/email:
 *   post:
 *     tags:
 *       - Referral
 *     description: Get a referral by email
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Referral'
 *      description: Get a referral by email
 *     responses:
 *      '200':
 *        description: Referral found
 *      '404':
 *        description: Referral not found
 *      '500':
 *       description: Internal server error
 */
router.post('/email', schemaValidation(emailReferralSchema), ReferralController.getByEmail);

/**
 * @swagger
 * /referral/invite:
 *   post:
 *     tags:
 *       - Referral
 *     description: Send a referral invite by email
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Referral'
 *      description: Send a referral invite by email
 *     responses:
 *      '200':
 *        description: Invite sent
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/invite',
  authenticate,
  schemaValidation(sendReferralSchema),
  ReferralController.sendInvite,
);

/**
 * @swagger
 * /referral/ref/:refcode:
 *   get:
 *     tags:
 *       - Referral
 *     description: Get a user's information by referral code
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Referral'
 *      description: Get a user's information by referral code
 *     responses:
 *      '200':
 *        description: returns referral
 *      '500':
 *       description: Internal server error
 */
router.get('/ref/:refcode', ReferralController.getUserByRefCode);

/**
 * @swagger
 * /referral/:id:
 *   get:
 *     tags:
 *       - Referral
 *     description: Get a referral by the id
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Referral'
 *      description: Get a referral by the id
 *     responses:
 *      '200':
 *        description: returns referral
 *      '500':
 *       description: Internal server error
 */
router.get('/:id', hasValidObjectId, ReferralController.getReferralById);

module.exports = router;
