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
 *        properties:
 *          badgeId:
 *            type: string
 *          userId:
 *            type: string
 *          assignedBy:
 *            type: string
 *        example:
 *           badgeId: 5f2b39035a086cfc4b7fa7f6
 *           userId: 5f5a71e1e26485102a780795
 *           assignedBy: 5f2b39035a086cfc4b7fa7f6
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
    assignedBy: {
      type: ObjectId,
    },
  },
  { timestamps: true },
);

const AssignedBadge = mongoose.model('AssignedBadge', AssignedBadgeSchema);

export default AssignedBadge;
