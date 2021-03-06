import mongoose from 'mongoose';

/**
 * @swagger
 *  components:
 *    schemas:
 *      NextPayment:
 *        type: object
 *        required:
 *          - expectedAmount
 *          - expiresOn
 *          - offerId
 *          - propertyId
 *          - resolved
 *          - resolvedDate
 *          - resolvedViaTransaction
 *          - transactionId
 *          - vendorId
 *        properties:
 *          expectedAmount:
 *            type: number
 *          expiresOn:
 *            type: date
 *          offerId:
 *            type: string
 *          propertyId:
 *            type: string
 *          resolved:
 *            type: boolean
 *          resolvedDate:
 *            type: date
 *          resolvedViaTransaction:
 *            type: boolean
 *          transactionId:
 *            type: string
 *          vendorId:
 *            type: string
 *        example:
 *           expectedAmount: 40000000
 *           expiresOn: 2020-01-01
 *           offerId: 5f22f7f8c790039da1242381
 *           propertyId: 5f22f8aec790039da1242382
 *           resolved: false
 *           resolvedDate: 2020-01-01
 *           resolvedViaTransaction: true
 *           transactionId: 5f2b39035a086cfc4b7fa722
 *           userId: 5f2b39035a086cfc4b7fa7f6
 *           vendorId: 5f22f7f8c790039da1242381
 */

const { ObjectId } = mongoose.Schema.Types;
const NextPaymentSchema = new mongoose.Schema(
  {
    expectedAmount: {
      type: Number,
      required: true,
    },
    expiresOn: {
      type: Date,
      required: true,
    },
    offerId: {
      type: ObjectId,
      required: true,
    },
    propertyId: {
      type: ObjectId,
      required: true,
    },
    resolvedDate: {
      type: Date,
    },
    resolvedViaTransaction: {
      type: Boolean,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    transactionId: {
      type: ObjectId,
    },
    userId: {
      type: ObjectId,
      required: true,
    },
    vendorId: {
      type: ObjectId,
      required: true,
    },
  },
  { timestamps: true },
);

const NextPayment = mongoose.model('NextPayment', NextPaymentSchema);

export default NextPayment;
