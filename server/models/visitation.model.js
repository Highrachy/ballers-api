import mongoose from 'mongoose';
import { VISITATION_STATUS } from '../helpers/constants';

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
 *          - visitDate
 *        properties:
 *          propertyId:
 *            type: string
 *          visitorName:
 *            type: string
 *          visitorEmail:
 *            type: string
 *          visitorPhone:
 *            type: string
 *          visitDate:
 *            type: date
 *        example:
 *           propertyId: 5f22f7f8c790039da1242381
 *           visitorName: John Doe
 *           visitorEmail: johndoe@mail.com
 *           visitorPhone: 08012345678
 *           visitDate: 2020-09-12
 */

const { ObjectId } = mongoose.Schema.Types;
const VisitationSchema = new mongoose.Schema(
  {
    propertyId: {
      type: ObjectId,
      required: true,
    },
    status: {
      type: String,
      default: VISITATION_STATUS.PENDING,
    },
    userId: {
      type: ObjectId,
      required: true,
    },
    vendorId: {
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
    visitDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

const Visitation = mongoose.model('Visitation', VisitationSchema);

export default Visitation;
