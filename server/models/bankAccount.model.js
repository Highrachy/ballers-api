import mongoose from 'mongoose';

/**
 * @swagger
 *  components:
 *    schemas:
 *      BankAccount:
 *        type: object
 *        required:
 *          - accountName
 *          - accountNumber
 *          - bankName
 *        properties:
 *          accountName:
 *            type: string
 *          accountNumber:
 *            type: string
 *          bankName:
 *            type: string
 *        example:
 *           accountName: Highrachy Investment & Technology Limited
 *           accountNumber: 0123456789
 *           bankName: ABC Bank
 */

const { ObjectId } = mongoose.Schema.Types;

const BankAccountSchema = new mongoose.Schema(
  {
    accountName: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    addedBy: {
      type: ObjectId,
      required: true,
    },
    approved: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: ObjectId,
    },
    bankName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
  { collation: { locale: 'en', strength: 2 } },
);

const BankAccount = mongoose.model('BankAccount', BankAccountSchema);

export default BankAccount;
