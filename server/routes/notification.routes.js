import express from 'express';
import { authenticate, hasValidObjectId } from '../helpers/middleware';
import NotificationController from '../controllers/notification.controllers';

const router = express.Router();

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
 * path:
 *  /notification/:id:
 *    get:
 *      parameters:
 *        - in: query
 *          name: token
 *          schema:
 *            type: string
 *          description: verifies user access
 *      summary: Get a notification based by its id
 *      tags: [Notification]
 *      responses:
 *        '200':
 *          description: Notification found
 *        '404':
 *          description: Notification not found
 *        '500':
 *          description: Internal server error
 */
router.get('/:id', authenticate, hasValidObjectId, NotificationController.getOneNotification);

module.exports = router;
