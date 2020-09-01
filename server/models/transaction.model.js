import mongoose from 'mongoose';

/**
 * @swagger
 *  components:
 *    schemas:
 *      Transaction:
 *        type: object
 *        required:
 *          - propertyId
 *          - userId
 *          - adminId
 *          - paymentSource
 *          - amount
 *        properties:
 *          propertyId:
 *            type: string
 *          userId:
 *            type: string
 *          adminId:
 *            type: string
 *          paymentSource:
 *            type: string
 *          amount:
 *            type: number
 *          paidOn:
 *            type: date
 *          additionalInfo:
 *            type: number
 *        example:
 *           propertyId: 5f22f7f8c790039da1242381
 *           userId: 5f22f7f8c790039da1242381
 *           adminId: 5f22f7f8c790039da1242381
 *           paymentSource: bank transfer
 *           amount: 15000000
 */

const { ObjectId } = mongoose.Schema.Types;
const TransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: ObjectId,
      required: true,
    },
    adminId: {
      type: ObjectId,
    },
    propertyId: {
      type: ObjectId,
      required: true,
    },
    paymentSource: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paidOn: {
      type: Date,
    },
    additionalInfo: {
      type: String,
    },
  },
  { timestamps: true },
);

const Transaction = mongoose.model('Transaction', TransactionSchema);

export default Transaction;
