import express from 'express';
import { authenticate, schemaValidation, isAdmin, hasValidObjectId } from '../helpers/middleware';
import {
  updateReferralSchema,
  sendReferralSchema,
  updateReferralPercentageSchema,
} from '../schemas/referral.schema';
import ReferralController from '../controllers/referral.controllers';

const router = express.Router();

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
router.get('/all', authenticate, ReferralController.getAllReferrals);

/**
 * @swagger
 * /referral/reward:
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
  '/reward',
  authenticate,
  isAdmin,
  schemaValidation(updateReferralSchema),
  ReferralController.updateReferralToRewarded,
);

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

/**
 * @swagger
 * /referral/percentage:
 *   put:
 *     tags:
 *       - Referral
 *     description: Updates the percentage for a referral
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Referral'
 *      description: Updates the percentage for a referral
 *     responses:
 *      '200':
 *        description: Referral percentage updated
 *      '400':
 *        description: Error updating percentage
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/percentage',
  authenticate,
  isAdmin,
  schemaValidation(updateReferralPercentageSchema),
  ReferralController.updateReferralPercentage,
);

module.exports = router;
