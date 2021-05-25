import mongoose from 'mongoose';
import { REFERRAL_STATUS, REWARD_STATUS } from '../helpers/constants';

/**
 * @swagger
 *  components:
 *    schemas:
 *      Referral:
 *        type: object
 *        required:
 *          - userId
 *          - referrerId
 *        properties:
 *          userId:
 *            type: string
 *          referrerId:
 *            type: string
 *          status:
 *            type: string
 *        example:
 *           userId: 5f5a64ea4661990c8f65e5e8
 *           referrerId: 5f2b39035a086cfc4b7fa7f6
 *           status: John
 */

const { ObjectId } = mongoose.Schema.Types;
const ReferralSchema = new mongoose.Schema(
  {
    userId: {
      type: ObjectId,
    },
    firstName: {
      type: String,
    },
    email: {
      type: String,
    },
    referrerId: {
      type: ObjectId,
      required: true,
    },
    offerId: {
      type: ObjectId,
    },
    status: {
      type: String,
      default: REFERRAL_STATUS.SENT,
    },
    reward: {
      amount: {
        type: Number,
      },
      status: {
        type: String,
        default: REWARD_STATUS.PENDING,
      },
      paidBy: {
        type: ObjectId,
      },
      paidOn: {
        type: Date,
      },
    },
  },
  { timestamps: true },
);

const Referral = mongoose.model('Referral', ReferralSchema);

export default Referral;
