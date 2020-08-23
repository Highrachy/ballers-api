import mongoose from 'mongoose';

/**
 * @swagger
 *  components:
 *    schemas:
 *      PaymentPlan:
 *        type: object
 *        required:
 *          - name
 *          - description
 *          - paymentFrequency
 *        properties:
 *          name:
 *            type: string
 *          description:
 *            type: string
 *          paymentFrequency:
 *            type: number
 *        example:
 *           name: Weekly payment
 *           description: payment is made once a week
 *           paymentFrequency: 4
 */

const { ObjectId } = mongoose.Schema.Types;
const PaymentPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    paymentFrequency: {
      type: Number,
      required: true,
    },
    propertiesAssignedTo: {
      type: [ObjectId],
    },
    addedBy: {
      type: ObjectId,
      required: true,
    },
    updatedBy: {
      type: ObjectId,
    },
  },
  { timestamps: true },
);

const PaymentPlan = mongoose.model('PaymentPlan', PaymentPlanSchema);

export default PaymentPlan;
