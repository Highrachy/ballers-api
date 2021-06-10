import mongoose from 'mongoose';
import { BADGE_ACCESS_LEVEL } from '../helpers/constants';

/**
 * @swagger
 *  components:
 *    schemas:
 *      Badge:
 *        type: object
 *        required:
 *          - name
 *          - userLevel
 *          - addedBy
 *          - dateAdded
 *        properties:
 *          name:
 *            type: string
 *          userLevel:
 *            type: number
 *          addedBy:
 *            type: string
 *          dateAdded:
 *            type: date
 *        example:
 *           name: Hero Badge
 *           userLevel: 0
 *           addedBy: 5f2b39035a086cfc4b7fa7f6
 *           dateAdded: 2020-11-20
 */

const { ObjectId } = mongoose.Schema.Types;
const BadgeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    userLevel: {
      type: Number,
      default: BADGE_ACCESS_LEVEL.ALL,
    },
    addedBy: {
      type: ObjectId,
      required: true,
    },
    dateAdded: {
      type: Date,
    },
  },
  { timestamps: true },
);

const Badge = mongoose.model('Badge', BadgeSchema);

export default Badge;
