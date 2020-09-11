import express from 'express';
import { authenticate, schemaValidation, isAdmin, hasValidObjectId } from '../helpers/middleware';
import updateReferralSchema from '../schemas/referral.schema';
import ReferralController from '../controllers/referral.controllers';

const router = express.Router();

/**
 * @swagger
 * /referral/:id:
 *   get:
 *     tags:
 *       - Referral
 *     description: Get all referrals by referee id
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Referral'
 *      description: Get all referrals by referee id
 *     responses:
 *      '200':
 *        description: returns object of referrals
 *      '500':
 *       description: Internal server error
 */
router.get('/:id', authenticate, hasValidObjectId, ReferralController.getReferraslByRefereeId);

/**
 * @swagger
 * /referral/registered:
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
  '/registered',
  authenticate,
  isAdmin,
  schemaValidation(updateReferralSchema),
  ReferralController.updateReferralToRegistered,
);

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

module.exports = router;
