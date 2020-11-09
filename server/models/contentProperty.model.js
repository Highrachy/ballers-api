import mongoose from 'mongoose';

/**
 * @swagger
 *  components:
 *    schemas:
 *      ContentProperty:
 *        type: object
 *        required:
 *          - state
 *          - area
 *          - longitude
 *          - latitude
 *          - category
 *          - houseType
 *          - price
 *          - website
 *          - link
 *        properties:
 *          state:
 *            type: string
 *          area:
 *            type: string
 *          longitude:
 *            type: number
 *          latitude:
 *            type: number
 *          category:
 *            type: string
 *          houseType:
 *            type: string
 *          price:
 *            type: number
 *          website:
 *            type: string
 *          link:
 *            type: string
 *        example:
 *           state: Lagos
 *           area: Lekki Phase 1
 *           longitude: 3.23453
 *           latitude: 3.23453
 *           category: For Sale
 *           houseType: 3 bedroom semi-detached duplex
 *           price: 10000000
 *           website: https://ballers.ng/property.html
 *           link: https://ballers.ng/property.html
 */

const ContentPropertySchema = new mongoose.Schema(
  {
    state: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      required: true,
    },
    longitude: {
      type: Number,
    },
    latitude: {
      type: Number,
    },
    category: {
      type: String,
      required: true,
    },
    houseType: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    website: {
      type: String,
    },
    link: {
      type: String,
    },
  },
  { timestamps: true },
);

const ContentProperty = mongoose.model('ContentProperty', ContentPropertySchema);

export default ContentProperty;
