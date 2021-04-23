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
 *          - url
 *          - status
 *        properties:
 *          userId:
 *            type: string
 *          description:
 *            type: string
 *          type:
 *            type: number
 *          url:
 *            type: string
 *          read:
 *            type: boolean
 *        example:
 *           userId: Lekki Phase 1
 *           description: Your account has been activated
 *           type: 1
 *           url: app.ballers.ng/dashboard
 *           read: false
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
    url: {
      type: String,
    },
    read: {
      type: Boolean,
      default: NOTIFICATION_STATUS.UNREAD,
    },
  },
  { timestamps: true },
);

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;
