import mongoose from 'mongoose';

/**
 * @swagger
 *  components:
 *    schemas:
 *      Visitation:
 *        type: object
 *        required:
 *          - propertyId
 *          - visitorName
 *          - visitorEmail
 *          - visitorPhone
 *        properties:
 *          propertyId:
 *            type: string
 *          visitorName:
 *            type: string
 *          visitorEmail:
 *            type: string
 *          visitorPhone:
 *            type: string
 *        example:
 *           propertyId: 5f22f7f8c790039da1242381
 *           visitorName: John Doe
 *           visitorEmail: johndoe@mail.com
 *           visitorPhone: 08012345678
 */

const { ObjectId } = mongoose.Schema.Types;
const VisitationSchema = new mongoose.Schema(
  {
    propertyId: {
      type: ObjectId,
      required: true,
    },
    userId: {
      type: ObjectId,
      required: true,
    },
    visitorName: {
      type: String,
      required: true,
    },
    visitorEmail: {
      type: String,
    },
    visitorPhone: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const Visitation = mongoose.model('Visitation', VisitationSchema);

export default Visitation;