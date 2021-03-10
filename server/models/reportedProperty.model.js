import mongoose from 'mongoose';

/**
 * @swagger
 *  components:
 *    schemas:
 *      ReportedProperty:
 *        type: object
 *        required:
 *          - propertyId
 *          - reason
 *          - reportedBy
 *        properties:
 *          propertyId:
 *            type: string
 *          reason:
 *            type: string
 *          reportedBy:
 *            type: string
 *          resolved:
 *            type: boolean
 *        example:
 *           propertyId: 603fa6b8e6cfa33387ecfe92
 *           reason: Property has misleading images
 *           reportedBy: 603c0300f8477208ed73b976
 */

const { ObjectId } = mongoose.Schema.Types;

const ReportedPropertySchema = new mongoose.Schema(
  {
    propertyId: {
      type: ObjectId,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    reportedBy: {
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
      notes: {
        type: String,
      },
      status: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true },
);

const ReportedProperty = mongoose.model('ReportedProperty', ReportedPropertySchema);

export default ReportedProperty;
