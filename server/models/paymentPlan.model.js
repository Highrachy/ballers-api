import mongoose from 'mongoose';

/**
 * @swagger
 *  components:
 *    schemas:
 *      PaymentPlan:
 *        type: object
 *        required:
 *          - planName
 *          - planDescription
 *          - paymentFrequency
 *        properties:
 *          planName:
 *            type: string
 *          planDescription:
 *            type: string
 *          paymentFrequency:
 *            type: string
 *        example:
 *           planName: Weekly payment
 *           planDescription: payment is made once a week
 *           paymentFrequency: weekly
 */

const { ObjectId } = mongoose.Schema.Types;
const PaymentPlanSchema = new mongoose.Schema(
  {
    planName: {
      type: String,
      required: true,
    },
    planDescription: {
      type: String,
      required: true,
    },
    paymentFrequency: {
      type: String,
      required: true,
    },
    addedBy: {
      type: ObjectId,
      required: true,
    },
  },
  { timestamps: true },
);

const PaymentPlan = mongoose.model('PaymentPlan', PaymentPlanSchema);

export default PaymentPlan;
