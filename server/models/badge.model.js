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
    automated: {
      type: Boolean,
      default: true,
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
      type: String,
    },
    icon: {
      name: {
        type: String,
      },
      color: {
        type: String,
      },
    },
    slug: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
  { collation: { locale: 'en', strength: 2 } },
);

const Badge = mongoose.model('Badge', BadgeSchema);

export default Badge;
