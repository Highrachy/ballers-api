import mongoose from 'mongoose';

/**
 * @swagger
 *  components:
 *    schemas:
 *      OfferLetter:
 *        type: object
 *        required:
 *          - userId
 *          - vendorId
 *          - enquiryid
 *          - propertyId
 *          - handOverDate
 *          - deliveryState
 *          - totalAmountPayable
 *          - allocationInPercentage
 *          - title
 *          - status
 *          - expires
 *          - signature
 *          - dateAccepted
 *          - initialPayment
 *          - monthlyPayment
 *          - paymentFrequency
 *        properties:
 *          userId:
 *            type: string
 *          vendorId:
 *            type: string
 *          enquiryid:
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
 *           vendorId: 5f2b39035a086cfc4b7fa7f6
 *           enquiryid: 5f2b39035a086cfc4b7fa7f6
 *           propertyId: 5f2b39035a086cfc4b7fa7f6
 *           handOverDate: 2020-01-01
 *           deliveryState: New
 *           totalAmountPayable: 40000000
 *           allocationInPercentage: 20
 *           title: 4 bedroom detatched duplex
 *           status: interested
 *           expires: 2020-01-01
 *           signature: http://www.ballers.ng/signature.png
 *           dateAccepted: 2020-01-01
 *           initialPayment: 10000000
 *           monthlyPayment: 500000
 *           paymentFrequency: 1
 */

const { ObjectId } = mongoose.Schema.Types;
const OfferLetterSchema = new mongoose.Schema(
  {
    userId: {
      type: ObjectId,
      required: true,
    },
    vendorId: {
      type: ObjectId,
      required: true,
    },
    enquiryid: {
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
      required: true,
    },
    expires: {
      type: Date,
      required: true,
    },
    signature: {
      type: String,
      required: true,
    },
    responseDate: {
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
    assignedBy: {
      type: ObjectId,
    },
  },
  { timestamps: true },
);

const OfferLetter = mongoose.model('OfferLetter', OfferLetterSchema);

export default OfferLetter;
