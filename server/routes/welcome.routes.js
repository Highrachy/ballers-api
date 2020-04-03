import express from 'express';
import WelcomeController from '../controllers/welcome.controllers';

const router = express.Router();

/**
 * @swagger
 * path:
 *  /:
 *    get:
 *      summary: A welcome text from Ballers API
 *      tags: [Welcome]
 *      responses:
 *        "200":
 *          description: A welcome object
 */
router.get('/', WelcomeController.welcome);

module.exports = router;
