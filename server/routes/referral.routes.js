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
router.get('/all', authenticate, hasValidObjectId, ReferralController.getMyReferrals);

/**
 * @swagger
 * /referral/:id:
 *   get:
 *     tags:
 *       - Referral
 *     description: Get all referrals by referrer id
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Referral'
 *      description: Get all referrals by referrer id
 *     responses:
 *      '200':
 *        description: returns object of referrals
 *      '500':
 *       description: Internal server error
 */
router.get('/:id', authenticate, isAdmin, hasValidObjectId, ReferralController.getAllUserReferrals);

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

module.exports = router;
