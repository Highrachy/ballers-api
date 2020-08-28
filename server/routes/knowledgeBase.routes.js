import express from 'express';
import { authenticate, schemaValidation, isAdmin, hasValidObjectId } from '../helpers/middleware';
import { addKnowledgeBaseSchema, updateKnowledgeBaseSchema } from '../schemas/knowledgeBase.schema';
import KnowledgeBaseController from '../controllers/knowledgeBase.controllers';

const router = express.Router();

/**
 * @swagger
 * /knowledge-base/add:
 *   post:
 *     tags:
 *       - KnowledgeBase
 *     description: Adds a new post to knowledge base
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/KnowledgeBase'
 *      description: Add a new post to knowledge base
 *     responses:
 *      '201':
 *        description: Post added to knowledge base
 *      '400':
 *        description: Error adding post to knowledge base
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/add',
  authenticate,
  isAdmin,
  schemaValidation(addKnowledgeBaseSchema),
  KnowledgeBaseController.add,
);

/**
 * @swagger
 * /knowledge-base/update:
 *   put:
 *     tags:
 *       - KnowledgeBase
 *     description: Updates existing post to knowledge base
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/KnowledgeBase'
 *      description: Updates existing post to knowledge base
 *     responses:
 *      '200':
 *        description: Post updated
 *      '400':
 *        description: Error updating post
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/update',
  authenticate,
  isAdmin,
  schemaValidation(updateKnowledgeBaseSchema),
  KnowledgeBaseController.update,
);

/**
 * @swagger
 * /knowledge-base/delete/:id:
 *   delete:
 *     tags:
 *       - KnowledgeBase
 *     description: Deletes specific post from knowledge base
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/KnowledgeBase'
 *      description: Deletes specific post from knowledge base
 *     responses:
 *      '200':
 *        description: Post deleted
 *      '500':
 *       description: Internal server error
 */
router.delete(
  '/delete/:id',
  authenticate,
  hasValidObjectId,
  isAdmin,
  KnowledgeBaseController.delete,
);

/**
 * @swagger
 * /knowledge-base/all:
 *   get:
 *     tags:
 *       - KnowledgeBase
 *     description: Get all posts in knowledge base
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/KnowledgeBase'
 *      description: Get all posts in knowledge base
 *     responses:
 *      '200':
 *        description: returns object of posts
 *      '500':
 *       description: Internal server error
 */
router.get('/all', authenticate, isAdmin, KnowledgeBaseController.getAll);

/**
 * @swagger
 * path:
 *  /knowledge-base/:id:
 *    get:
 *      parameters:
 *        - in: query
 *          name: token
 *          schema:
 *            type: string
 *          description: verifies user access
 *      summary: Gets a post from the knowledge base based by its ID
 *      tags: [KnowledgeBase]
 *      responses:
 *        '200':
 *          description: Post found
 *        '500':
 *          description: Internal server error
 */
router.get('/:id', authenticate, hasValidObjectId, isAdmin, KnowledgeBaseController.getOne);

module.exports = router;
