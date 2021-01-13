import mongoose from 'mongoose';
import { addressSchema } from '../helpers/constants';

/**
 * @swagger
 *  components:
 *    schemas:
 *      Enquiry:
 *        type: object
 *        required:
 *          - title
 *          - propertyId
 *          - firstName
 *          - otherName
 *          - lastName
 *          - address
 *          - occupation
 *          - phone
 *          - email
 *          - nameOnTitleDocument
 *          - investmentFrequency
 *          - initialInvestmentAmount
 *          - periodicInvestmentAmount
 *          - investmentStartDate
 *        properties:
 *          title:
 *            type: string
 *          propertyId:
 *            type: string
 *          firstName:
 *            type: string
 *          otherName:
 *            type: string
 *          lastName:
 *            type: string
 *          address:
 *            type: object
 *          occupation:
 *            type: string
 *          phone:
 *            type: string
 *          phone2:
 *            type: string
 *          email:
 *            type: string
 *          nameOnTitleDocument:
 *            type: string
 *          investmentFrequency:
 *            type: string
 *          initialInvestmentAmount:
 *            type: number
 *          periodicInvestmentAmount:
 *            type: number
 *          investmentStartDate:
 *            type: date
 *        example:
 *           title: Mr
 *           propertyId: 5f2b39035a086cfc4b7fa7f6
 *           firstName: John
 *           otherName: Francis
 *           lastName: Doe
 *           phone: 08012345678
 *           phone2: 08012345678
 *           address: {street1: 1 sesame street, street2: 12 solomon close, city: Ikeja, state: Lagos, country: Nigeria}
 *           occupation: Lawyer
 *           email: johndoe@email.com
 *           nameOnTitleDocument: John F. Doe
 *           investmentFrequency: Monthly
 *           initialInvestmentAmount: 25000000
 *           periodicInvestmentAmount: 5000000
 *           investmentStartDate: 2020-01-01
 */

const { ObjectId } = mongoose.Schema.Types;
const EnquirySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    propertyId: {
      type: ObjectId,
      required: true,
    },
    userId: {
      type: ObjectId,
      required: true,
    },
    vendorId: {
      type: ObjectId,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    otherName: {
      type: String,
    },
    lastName: {
      type: String,
      required: true,
    },
    address: addressSchema,
    occupation: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    phone2: {
      type: String,
    },
    email: {
      type: String,
      required: true,
    },
    nameOnTitleDocument: {
      type: String,
      required: true,
    },
    investmentFrequency: {
      type: String,
      required: true,
    },
    initialInvestmentAmount: {
      type: Number,
      required: true,
    },
    periodicInvestmentAmount: {
      type: Number,
      required: true,
    },
    investmentStartDate: {
      type: Date,
      required: true,
    },
    approved: {
      type: Boolean,
      default: false,
    },
    approvedBy: ObjectId,
    approvalDate: Date,
  },
  { timestamps: true },
);

const Enquiry = mongoose.model('Enquiry', EnquirySchema);

export default Enquiry;
