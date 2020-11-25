import mongoose from 'mongoose';

/**
 * @swagger
 *  components:
 *    schemas:
 *      ContentProperty:
 *        type: object
 *        required:
 *          - areaId
 *          - category
 *          - houseType
 *          - price
 *          - website
 *          - link
 *        properties:
 *          areaId:
 *            type: objectid
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
 *           areaId: 5f2b39035a086cfc4b7fa7f6
 *           category: For Sale
 *           houseType: 3 bedroom semi-detached duplex
 *           price: 10000000
 *           website: https://ballers.ng/property.html
 *           link: https://ballers.ng/property.html
 */

const { ObjectId } = mongoose.Schema.Types;
const ContentPropertySchema = new mongoose.Schema(
  {
    areaId: {
      type: ObjectId,
      required: true,
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
  { collation: { locale: 'en', strength: 2 } },
);

const ContentProperty = mongoose.model('ContentProperty', ContentPropertySchema);

export default ContentProperty;
