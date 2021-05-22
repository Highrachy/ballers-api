import express from 'express';
import { authenticate, isAdminOrUserOrVendor } from '../helpers/middleware';
import TotalCountController from '../controllers/totalCount.controllers';

const router = express.Router();

/**
 * @swagger
 * path:
 *  /total-count/:
 *    get:
 *      summary: Count the total number of each model in the database
 *      tags: [Models]
 *      responses:
 *        "200":
 *          description: All models
 */
router.get('/', authenticate, isAdminOrUserOrVendor, TotalCountController.getTotalCount);

module.exports = router;
