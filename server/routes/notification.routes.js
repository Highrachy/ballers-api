import express from 'express';
import { authenticate, hasValidObjectId } from '../helpers/middleware';
import NotificationController from '../controllers/notification.controllers';

const router = express.Router();

/**
 * @swagger
 * /notification/all:
 *   get:
 *     tags:
 *       - Notification
 *     description: Get all user notifications
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Notification'
 *      description: Get all user notifications
 *     responses:
 *      '200':
 *        description: returns notifications
 *      '500':
 *       description: Internal server error
 */
router.get('/all', authenticate, NotificationController.getAllNotifications);

/**
 * @swagger
 * /notification/mark-all-as-read:
 *   put:
 *     tags:
 *       - Notification
 *     description: Marks all notifications as read
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *     responses:
 *      '200':
 *        description: Notifications marked as read
 *      '400':
 *        description: Bad request
 *      '500':
 *       description: Internal server error
 */
router.put('/mark-all-as-read', authenticate, NotificationController.markAllNotificationsAsRead);

/**
 * @swagger
 * /notification/:id:
 *   put:
 *     tags:
 *       - Notification
 *     description: Marks a notification as read
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              notificationId:
 *                  type: string
 *     responses:
 *      '200':
 *        description: Notification marked as read
 *      '400':
 *        description: Bad request
 *      '500':
 *       description: Internal server error
 */
router.put('/:id', authenticate, hasValidObjectId, NotificationController.markNotificationAsRead);

module.exports = router;
