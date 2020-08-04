import mongoose from 'mongoose';

/**
 * @swagger
 *  components:
 *    schemas:
 *      Enquiry:
 *        type: object
 *        required:
 *          - title
 *          - firstName
 *          - otherName
 *          - lastName
 *          - address
 *          - occupation
 *          - phone
 *          - email
 *          - preferredPropertyLocation
 *          - propertyType
 *          - nameOnTitleDocument
 *          - investmentFrequency
 *          - initialInvestmentAmount
 *          - periodicInvestmentAmount
 *          - investmentStartDate
 *        properties:
 *          title:
 *            type: string
 *          firstName:
 *            type: string
 *          otherName:
 *            type: string
 *          lastName:
 *            type: string
 *          address:
 *            type: string
 *          occupation:
 *            type: string
 *          phone:
 *            type: string
 *          email:
 *            type: string
 *          preferredPropertyLocation:
 *            type: string
 *          propertyType:
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
 *           firstName: John
 *           otherName: Francis
 *           lastName: Doe
 *           address: 1, sesame street, ajah.
 *           occupation: Lawyer
 *           phone: 08012345678
 *           email: johndoe@email.com
 *           preferredPropertyLocation: Lekki phase 1
 *           propertyType: 3 bedroom flat
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
    address: {
      type: String,
      required: true,
    },
    occupation: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    preferredPropertyLocation: {
      type: String,
      required: true,
    },
    propertyType: {
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
