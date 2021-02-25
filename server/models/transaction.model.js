import mongoose from 'mongoose';

/**
 * @swagger
 *  components:
 *    schemas:
 *      Transaction:
 *        type: object
 *        required:
 *          - addedBy
 *          - additionalInfo
 *          - amount
 *          - offerId
 *          - paidOn
 *          - paymentSource
 *          - propertyId
 *          - userId
 *          - vendorId
 *        properties:
 *          addedBy:
 *            type: string
 *          additionalInfo:
 *            type: string
 *          amount:
 *            type: number
 *          offerId:
 *            type: string
 *          paidOn:
 *            type: date
 *          paymentSource:
 *            type: string
 *          propertyId:
 *            type: string
 *          userId:
 *            type: string
 *          vendorId:
 *            type: string
 *        example:
 *           addedBy: 5f22f7f8c790039da1242381
 *           additionalInfo: Lorem ipsum
 *           amount: 15000000
 *           offerId: 5f7a453a605ddb721fc26946
 *           paidOn: 2020-11-12
 *           paymentSource: bank transfer
 *           propertyId: 5f22f7f8c790039da1242312
 *           userId: 5f4502b70e3a39175130ad52
 *           vendorId: 5f74473ff99c5fdff59a8f16
 */

const { ObjectId } = mongoose.Schema.Types;
const TransactionSchema = new mongoose.Schema(
  {
    addedBy: {
      type: ObjectId,
      required: true,
    },
    additionalInfo: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    offerId: {
      type: ObjectId,
      required: true,
    },
    paidOn: {
      type: Date,
      required: true,
    },
    paymentSource: {
      type: String,
      required: true,
    },
    propertyId: {
      type: ObjectId,
      required: true,
    },
    userId: {
      type: ObjectId,
      required: true,
    },
    updatedBy: {
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

const Transaction = mongoose.model('Transaction', TransactionSchema);

export default Transaction;
