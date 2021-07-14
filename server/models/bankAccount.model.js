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
 *          - bank
 *        properties:
 *          accountName:
 *            type: string
 *          accountNumber:
 *            type: number
 *          bank:
 *            type: number
 *        example:
 *           accountName: Highrachy Investment & Technology Limited
 *           accountNumber: 0123456789
 *           bank: ABC Bank
 */

const { ObjectId } = mongoose.Schema.Types;

const BankAccountSchema = new mongoose.Schema(
  {
    accountName: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: Number,
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
    bank: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
  { collation: { locale: 'en', strength: 2 } },
);

const BankAccount = mongoose.model('BankAccount', BankAccountSchema);

export default BankAccount;
