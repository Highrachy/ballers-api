import mongoose from 'mongoose';
import { OFFER_STATUS, CONCERN_STATUS } from '../helpers/constants';

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
 *          - periodicPayment
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
 *          periodicPayment:
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
 *           periodicPayment: 500000
 *           paymentFrequency: 14
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
    contributionReward: {
      type: Number,
      default: 0,
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
    initialPaymentDate: {
      type: Date,
      required: true,
    },
    periodicPayment: {
      type: Number,
      required: true,
    },
    paymentFrequency: {
      type: Number,
      required: true,
    },
    concern: [
      {
        question: {
          type: String,
        },
        dateAsked: {
          type: Date,
        },
        response: {
          type: String,
        },
        dateResponded: {
          type: Date,
        },
        status: {
          type: String,
          default: CONCERN_STATUS.PENDING,
        },
      },
    ],
    additionalClause: {
      type: String,
    },
    otherPayments: [
      {
        name: {
          type: String,
        },
        amount: {
          type: Number,
        },
      },
    ],
    paymentAccount: {
      type: ObjectId,
    },
    otherTerms: {
      administrativeCharge: {
        type: Number,
      },
      bankDraftDue: {
        type: Date,
      },
      dateDue: {
        type: Date,
      },
      deductibleRefundPercentage: {
        type: Number,
      },
      gracePeriod: {
        type: Date,
      },
      terminationInterest: {
        type: Number,
      },
      terminationPeriod: {
        type: Date,
      },
    },
  },
  { timestamps: true },
);

const Offer = mongoose.model('Offer', OfferSchema);

export default Offer;
