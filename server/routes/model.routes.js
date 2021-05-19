import express from 'express';
import { authenticate, isAdminOrUserOrVendor } from '../helpers/middleware';
import ModelController from '../controllers/model.controllers';

const router = express.Router();

/**
 * @swagger
 * path:
 *  /:
 *    get:
 *      summary: Returns all models in database
 *      tags: [Models]
 *      responses:
 *        "200":
 *          description: All models
 */
router.get('/', authenticate, isAdminOrUserOrVendor, ModelController.getAllModels);

module.exports = router;
