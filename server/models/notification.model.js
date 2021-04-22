import mongoose from 'mongoose';
import { NOTIFICATION_TYPE, NOTIFICATION_STATUS } from '../helpers/constants';

/**
 * @swagger
 *  components:
 *    schemas:
 *      Notification:
 *        type: object
 *        required:
 *          - userId
 *          - description
 *          - type
 *          - URL
 *          - status
 *        properties:
 *          userId:
 *            type: string
 *          description:
 *            type: number
 *          type:
 *            type: number
 *          URL:
 *            type: string
 *          status:
 *            type: number
 *        example:
 *           userId: Lekki Phase 1
 *           description: Your account has been activated
 *           type: 1
 *           URL: app.ballers.ng/dashboard
 *           status: 0
 */

const { ObjectId } = mongoose.Schema.Types;

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: ObjectId,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: Number,
      default: NOTIFICATION_TYPE.DANGER,
    },
    URL: {
      type: String,
    },
    status: {
      type: Number,
      default: NOTIFICATION_STATUS.UNREAD,
    },
  },
  { timestamps: true },
);

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;
