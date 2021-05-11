import mongoose from 'mongoose';
import { NOTIFICATION_TYPE } from '../helpers/constants';

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
 *          - action
 *          - status
 *        properties:
 *          userId:
 *            type: string
 *          description:
 *            type: string
 *          type:
 *            type: number
 *          action:
 *            type: string
 *          read:
 *            type: boolean
 *        example:
 *           userId: Lekki Phase 1
 *           description: Your account has been activated
 *           type: 1
 *           action: app.ballers.ng/dashboard
 *           read: false
 */

const { ObjectId } = mongoose.Schema.Types;

const NotificationSchema = new mongoose.Schema(
  {
    action: {
      type: String,
    },
    actionId: {
      type: ObjectId,
    },
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
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;
