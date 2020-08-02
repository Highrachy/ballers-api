import mongoose from 'mongoose';

/**
 * @swagger
 *  components:
 *    schemas:
 *      Visit:
 *        type: object
 *        required:
 *          - propertyId
 *          - visitorId
 *          - visitorName
 *          - visitorPhone
 *        properties:
 *          propertyId:
 *            type: string
 *          visitorId:
 *            type: string
 *          visitorName:
 *            type: string
 *          visitorPhone:
 *            type: string
 *        example:
 *           propertyId: 5f22f7f8c790039da1242381
 *           visitorId: 5f22f7f8c790039da1223456
 *           visitorName: John Doe
 *           visitorPhone: 08012345678
 */

const { ObjectId } = mongoose.Schema.Types;
const VisitSchema = new mongoose.Schema(
  {
    propertyId: {
      type: ObjectId,
      required: true,
    },
    visitorId: {
      type: ObjectId,
      required: true,
    },
    visitorName: {
      type: String,
      required: true,
    },
    visitorPhone: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const Visit = mongoose.model('Visit', VisitSchema);

export default Visit;
