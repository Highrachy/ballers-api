import mongoose from 'mongoose';
import { OFFER_STATUS } from '../helpers/constants';

/**
 * @swagger
 *  components:
 *    schemas:
 *      Offer:
 *        type: object
 *        required:
 *          - userId
 *          - vendorId
 *          - enquiryId
 *          - propertyId
 *          - handOverDate
 *          - deliveryState
 *          - totalAmountPayable
 *          - allocationInPercentage
 *          - title
 *          - status
 *          - expires
 *          - dateAccepted
 *          - initialPayment
 *          - monthlyPayment
 *          - paymentFrequency
 *        properties:
 *          userId:
 *            type: string
 *          vendorId:
 *            type: string
 *          enquiryId:
 *            type: string
 *          propertyId:
 *            type: string
 *          handOverDate:
 *            type: date
 *          deliveryState:
 *            type: string
 *          totalAmountPayable:
 *            type: number
 *          allocationInPercentage:
 *            type: number
 *          title:
 *            type: string
 *          status:
 *            type: string
 *          expires:
 *            type: date
 *          signature:
 *            type: string
 *          dateAccepted:
 *            type: date
 *          initialPayment:
 *            type: number
 *          monthlyPayment:
 *            type: number
 *          paymentFrequency:
 *            type: number
 *        example:
 *           userId: 5f2b39035a086cfc4b7fa7f6
 *           vendorId: 5f22f7f8c790039da1242381
 *           enquiryId: 5f5a71e1e26485102a780795
 *           propertyId: 5f22f8aec790039da1242382
 *           handOverDate: 2020-01-01
 *           deliveryState: New
 *           totalAmountPayable: 40000000
 *           allocationInPercentage: 20
 *           title: 4 bedroom detatched duplex
 *           status: Interested
 *           expires: 2020-01-01
 *           signature: http://www.ballers.ng/signature.png
 *           dateAccepted: 2020-01-01
 *           initialPayment: 10000000
 *           monthlyPayment: 500000
 *           paymentFrequency: 1
 */

const { ObjectId } = mongoose.Schema.Types;
const OfferSchema = new mongoose.Schema(
  {
    userId: {
      type: ObjectId,
      required: true,
    },
    vendorId: {
      type: ObjectId,
      required: true,
    },
    enquiryId: {
      type: ObjectId,
      required: true,
    },
    propertyId: {
      type: ObjectId,
      required: true,
    },
    handOverDate: {
      type: Date,
      required: true,
    },
    deliveryState: {
      type: String,
      required: true,
    },
    referenceCode: {
      type: String,
      required: true,
    },
    totalAmountPayable: {
      type: Number,
      required: true,
    },
    allocationInPercentage: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: OFFER_STATUS.GENERATED,
    },
    expires: {
      type: Date,
      required: true,
    },
    signature: {
      type: String,
    },
    responseDate: {
      type: Date,
    },
    dateAssigned: {
      type: Date,
    },
    initialPayment: {
      type: Number,
      required: true,
    },
    monthlyPayment: {
      type: Number,
      required: true,
    },
    paymentFrequency: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

const Offer = mongoose.model('Offer', OfferSchema);

export default Offer;
