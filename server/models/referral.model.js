import mongoose from 'mongoose';
import { REFERRAL_STATUS } from '../helpers/constants';

/**
 * @swagger
 *  components:
 *    schemas:
 *      Referral:
 *        type: object
 *        required:
 *          - userId
 *          - refereeId
 *          - registrationDate
 *          - status
 *        properties:
 *          userId:
 *            type: string
 *          refereeId:
 *            type: string
 *          registrationDate:
 *            type: date
 *          status:
 *            type: string
 *        example:
 *           userId: 5f5a64ea4661990c8f65e5e8
 *           refereeId: 5f2b39035a086cfc4b7fa7f6
 *           registrationDate: 2020-01-01
 *           status: John
 */

const { ObjectId } = mongoose.Schema.Types;
const ReferralSchema = new mongoose.Schema(
  {
    userId: {
      type: ObjectId,
      required: true,
    },
    refereeId: {
      type: ObjectId,
      required: true,
    },
    registrationDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      default: REFERRAL_STATUS.SENT,
    },
  },
  { timestamps: true },
);

const Referral = mongoose.model('Referral', ReferralSchema);

export default Referral;
