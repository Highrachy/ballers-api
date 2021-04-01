import mongoose from 'mongoose';

/**
 * @swagger
 *  components:
 *    schemas:
 *      OfflinePayment:
 *        type: object
 *        required:
 *          - amount
 *          - bank
 *          - date
 *          - offerId
 *          - type
 *        properties:
 *          amount:
 *            type: number
 *          bank:
 *            type: string
 *          date:
 *            type: date
 *          offerId:
 *            type: string
 *          reciept:
 *            type: string
 *          type:
 *            type: string
 *        example:
 *           amount: 10000000
 *           bank: GT Bank
 *           date: 2020-11-02
 *           offerId: 603c0300f8477208ed73b976
 *           reciept: https://ballers.ng/paymentscreenshot.jpg
 *           type: Cash deposit
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
    date: {
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
    reciept: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const OfflinePayment = mongoose.model('OfflinePayment', OfflinePaymentSchema);

export default OfflinePayment;
