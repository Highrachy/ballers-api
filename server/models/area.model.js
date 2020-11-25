import mongoose from 'mongoose';

/**
 * @swagger
 *  components:
 *    schemas:
 *      Area:
 *        type: object
 *        required:
 *          - area
 *          - state
 *          - longitude
 *          - latitude
 *        properties:
 *          area:
 *            type: string
 *          state:
 *            type: string
 *          longitude:
 *            type: number
 *          latitude:
 *            type: number
 *        example:
 *           area: Lekki Phase 1
 *           state: Lagos
 *           longitude: 3.23453
 *           latitude: 3.23453
 */

const AreaSchema = new mongoose.Schema(
  {
    area: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    longitude: {
      type: Number,
    },
    latitude: {
      type: Number,
    },
  },
  { timestamps: true },
  { collation: { locale: 'en', strength: 2 } },
);

const Area = mongoose.model('Area', AreaSchema);

export default Area;
