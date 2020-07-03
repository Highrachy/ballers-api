import mongoose from 'mongoose';

/**
 * @swagger
 *  components:
 *    schemas:
 *      Property:
 *        type: object
 *        required:
 *          - refNo
 *          - owner
 *          - category
 *          - type
 *          - price
 *          - area
 *          - state
 *        properties:
 *          refNo:
 *            type: string
 *          owner:
 *            type: string
 *          category:
 *            type: string
 *          type:
 *            type: string
 *          price:
 *            type: string
 *          area:
 *            type: string
 *          state:
 *            type: string
 *        example:
 *           refNo: 100221
 *           owner: 5e8b3645c9c76504f526c61f
 *           category: For Sale
 *           type: 1 bedroom
 *           price: 10000000
 *           area: Lekki Phase 1
 *           state: Lagos
 */

const PropertySchema = new mongoose.Schema(
  {
    refNo: {
      type: String,
      unique: true,
      required: true,
    },
    owner: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const Property = mongoose.model('Property', PropertySchema);

export default Property;
