import mongoose from 'mongoose';

/**
 * @swagger
 *  components:
 *    schemas:
 *      KnowledgeBase:
 *        type: object
 *        required:
 *          - title
 *          - author
 *          - body
 *        properties:
 *          title:
 *            type: string
 *          author:
 *            type: string
 *          body:
 *            type: string
 *          readLength:
 *            type: string
 *          image:
 *            type: string
 *          tags:
 *            type: string
 *        example:
 *           title: How to create your account
 *           author: John Doe
 *           body: Lorem ipsum dolor, sit amet consectetur adipisicing elit. Aut omnis deserunt perferendis adipisci impedit quae quia consectetur sint non ab consequuntur recusandae maiores soluta nostrum, repellat suscipit quisquam accusantium illo?
 *           readLength: 2 (in minutes)
 *           image: https://picsum.photos/200
 *           tags: [product design, culture]
 */

const { ObjectId } = mongoose.Schema.Types;

const KnowledgeBaseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    readLength: {
      type: Number,
    },
    image: {
      type: String,
    },
    tags: {
      type: [String],
    },
    updatedBy: {
      type: ObjectId,
      required: true,
    },
  },
  { timestamps: true },
);

const KnowledgeBase = mongoose.model('KnowledgeBase', KnowledgeBaseSchema);

export default KnowledgeBase;
