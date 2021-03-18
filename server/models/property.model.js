import mongoose from 'mongoose';
import { addressSchema } from '../helpers/constants';

/**
 * @swagger
 *  components:
 *    schemas:
 *      Property:
 *        type: object
 *        required:
 *          - name
 *          - titleDocument
 *          - state
 *          - area
 *          - price
 *          - units
 *          - houseType
 *          - bedrooms
 *          - toilets
 *          - bathrooms
 *          - description
 *          - floorPlans
 *          - mapLocation
 *          - neighborhood
 *          - mainImage
 *          - gallery
 *        properties:
 *          name:
 *            type: string
 *          titleDocument:
 *            type: string
 *          address:
 *            type: object
 *          price:
 *            type: number
 *          units:
 *            type: number
 *          houseType:
 *            type: string
 *          bedrooms:
 *            type: number
 *          toilets:
 *            type: number
 *          bathrooms:
 *            type: number
 *          description:
 *            type: string
 *          floorPlans:
 *            type: array
 *          mapLocation:
 *            type: object
 *          neighborhood:
 *            type: array
 *          mainImage:
 *            type: string
 *          gallery:
 *            type: array
 *        example:
 *           name: 3 bedroom semi-detached duplex
 *           titleDocument: https://ballers.ng/sampletitledocument.pdf
 *           address: {street1: 1 sesame street, street2: 12 solomon close, city: Ikeja, state: Lagos, country: Nigeria}
 *           price: 10000000
 *           units: 15
 *           houseType: 3 bedroom semi-detached duplex
 *           bedrooms: 3
 *           bathrooms: 3
 *           toilets: 4
 *           description: Newly built 3 bedroom semi-detached duplex
 *           floorPlans: ['http://linktoplan.ng/plan1.png','http://linktoplan.ng/plan2.png' ]
 *           mapLocation: {longitude: 1.23456, latitude: 2.34567}
 *           neighborhood: {schools: [{name: British International,distance: 1500km, mapLocation: {longitude: 1.23456, latitude: 2.34567}}]}
 *           mainImage: https://picsum.photos/200
 *           gallery: [{title: main image, url: 'https://picsum.photos/200'}]
 */

const { ObjectId } = mongoose.Schema.Types;

const neighborhoodInfoSchema = [
  {
    distance: {
      type: Number,
    },
    mapLocation: {
      longitude: {
        type: Number,
      },
      latitude: {
        type: Number,
      },
    },
    name: {
      type: String,
    },
  },
];

const PropertySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    titleDocument: {
      type: String,
    },
    address: addressSchema,
    price: {
      type: Number,
      required: true,
    },
    units: {
      type: Number,
      required: true,
    },
    houseType: {
      type: String,
      required: true,
    },
    bedrooms: {
      type: Number,
      required: true,
    },
    toilets: {
      type: Number,
      required: true,
    },
    bathrooms: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    features: {
      type: [String],
    },
    floorPlans: [
      {
        name: {
          type: String,
        },
        plan: {
          type: String,
        },
      },
    ],
    mapLocation: {
      longitude: {
        type: Number,
      },
      latitude: {
        type: Number,
      },
    },
    neighborhood: {
      entertainments: neighborhoodInfoSchema,
      hospitals: neighborhoodInfoSchema,
      pointsOfInterest: neighborhoodInfoSchema,
      restaurantsAndBars: neighborhoodInfoSchema,
      schools: neighborhoodInfoSchema,
      shoppingMalls: neighborhoodInfoSchema,
    },
    mainImage: {
      type: String,
    },
    gallery: [
      {
        title: {
          type: String,
        },
        url: {
          type: String,
        },
      },
    ],
    assignedTo: {
      type: [ObjectId],
    },
    paymentPlan: {
      type: [ObjectId],
    },
    addedBy: {
      type: ObjectId,
      required: true,
    },
    updatedBy: {
      type: ObjectId,
      required: true,
    },
    flagged: {
      status: {
        type: Boolean,
        default: false,
      },
      case: [
        {
          flaggedBy: {
            type: ObjectId,
          },
          flaggedDate: {
            type: Date,
          },
          flaggedReason: {
            type: String,
          },
          unflaggedBy: {
            type: ObjectId,
          },
          unflaggedDate: {
            type: Date,
          },
          unflaggedReason: {
            type: String,
          },
        },
      ],
    },
  },
  { timestamps: true },
);

const Property = mongoose.model('Property', PropertySchema);

export default Property;
