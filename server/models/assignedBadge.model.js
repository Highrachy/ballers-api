import mongoose from 'mongoose';

/**
 * @swagger
 *  components:
 *    schemas:
 *      AssignedBadge:
 *        type: object
 *        required:
 *          - badgeId
 *          - userId
 *          - assignedBy
 *          - dateAssigned
 *        properties:
 *          badgeId:
 *            type: string
 *          userId:
 *            type: string
 *          assignedBy:
 *            type: string
 *          dateAssigned:
 *            type: date
 *        example:
 *           badgeId: 5f2b39035a086cfc4b7fa7f6
 *           userId: 5f5a71e1e26485102a780795
 *           assignedBy: 5f2b39035a086cfc4b7fa7f6
 *           dateAssigned: 2020-11-20
 */

const { ObjectId } = mongoose.Schema.Types;
const AssignedBadgeSchema = new mongoose.Schema(
  {
    badgeId: {
      type: ObjectId,
      required: true,
    },
    userId: {
      type: ObjectId,
      required: true,
    },
    addedBy: {
      type: ObjectId,
      required: true,
    },
    dateAssigned: {
      type: Date,
    },
  },
  { timestamps: true },
);

const AssignedBadge = mongoose.model('AssignedBadge', AssignedBadgeSchema);

export default AssignedBadge;
