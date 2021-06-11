import mongoose from 'mongoose';
import { BADGE_ACCESS_LEVEL } from '../helpers/constants';

/**
 * @swagger
 *  components:
 *    schemas:
 *      Badge:
 *        type: object
 *        required:
 *          - addedBy
 *          - assignedRole
 *          - name
 *          - image
 *        properties:
 *          addedBy:
 *            type: string
 *          assignedRole:
 *            type: number
 *          name:
 *            type: string
 *          image:
 *            type: date
 *        example:
 *           addedBy: 5f2b39035a086cfc4b7fa7f6
 *           name: Hero Badge
 *           assignedRole: 0
 *           image: https://ballers.ng/badge.png
 */

const { ObjectId } = mongoose.Schema.Types;
const BadgeSchema = new mongoose.Schema(
  {
    addedBy: {
      type: ObjectId,
    },
    assignedRole: {
      type: Number,
      default: BADGE_ACCESS_LEVEL.ALL,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: ObjectId,
      required: true,
    },
  },
  { timestamps: true },
);

const Badge = mongoose.model('Badge', BadgeSchema);

export default Badge;
