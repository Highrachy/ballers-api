import mongoose from 'mongoose';
import { CONCERN_STATUS } from '../helpers/constants';

/**
 * @swagger
 *  components:
 *    schemas:
 *      OfflinePayment:
 *        type: object
 *        required:
 *          - amount
 *          - bank
 *          - dateOfPayment
 *          - offerId
 *          - type
 *        properties:
 *          amount:
 *            type: number
 *          bank:
 *            type: string
 *          dateOfPayment:
 *            type: date
 *          offerId:
 *            type: string
 *          receipt:
 *            type: string
 *          type:
 *            type: string
 *        example:
 *           amount: 10000000
 *           bank: GT Bank
 *           dateOfPayment: 2020-11-02
 *           offerId: 603c0300f8477208ed73b976
 *           receipt: https://ballers.ng/paymentscreenshot.jpg
 *           type: Cash deposit
 *           comments: [{question: is there an error, dateAsked: 2020-11-01, response: yes there is , dateResponded: 2020-11-02, status: true}]
 */

const { ObjectId } = mongoose.Schema.Types;
const OfflinePaymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    bank: {
      type: String,
      required: true,
    },
    comments: [
      {
        askedBy: {
          type: ObjectId,
        },
        question: {
          type: String,
        },
        dateAsked: {
          type: Date,
        },
        response: {
          type: String,
        },
        dateResponded: {
          type: Date,
        },
        respondedBy: {
          type: ObjectId,
        },
        status: {
          type: String,
          default: CONCERN_STATUS.PENDING,
        },
      },
    ],
    dateOfPayment: {
      type: Date,
      required: true,
    },
    offerId: {
      type: ObjectId,
      required: true,
    },
    resolved: {
      by: {
        type: ObjectId,
      },
      date: {
        type: Date,
      },
      status: {
        type: Boolean,
        default: false,
      },
    },
    receipt: {
      type: String,
    },
    type: {
      type: String,
      required: true,
    },
    userId: {
      type: ObjectId,
      required: true,
    },
  },
  { timestamps: true },
);

const OfflinePayment = mongoose.model('OfflinePayment', OfflinePaymentSchema);

export default OfflinePayment;
