import mongoose from 'mongoose';

/**
 * @swagger
 *  components:
 *    schemas:
 *      Property:
 *        type: object
 *        required:
 *          - name
 *          - location
 *          - price
 *          - units
 *          - houseType
 *          - bedrooms
 *          - toilets
 *          - description
 *          - floorPlans
 *          - mapLocation
 *          - neighborhood
 *          - addedBy
 *          - updatedBy
 *        properties:
 *          name:
 *            type: string
 *          location:
 *            type: string
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
 *          description:
 *            type: string
 *          floorPlans:
 *            type: string
 *          mapLocation:
 *            type: string
 *          neighborhood:
 *            type: string
 *          addedBy:
 *            type: string
 *          updatedBy:
 *            type: string
 *        example:
 *           name: 3 bedroom semi-detached duplex
 *           location: Lagos
 *           price: 10000000
 *           units: 15
 *           houseType: 3 bedroom semi-detached duplex
 *           bedrooms: 3
 *           toilets: 4
 *           description: Newly built 3 bedroom semi-detached duplex
 *           floorPlans: http://linktoplan.ng
 *           mapLocation: 10000000
 *           neighborhood: Lekki Phase 1
 *           addedBy: 5f05baaca6eb370d309f4e19
 *           updatedBy: 5f05baaca6eb370d309f4e19
 */

const { ObjectId } = mongoose.Schema.Types;

const PropertySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
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
    description: {
      type: String,
      required: true,
    },
    floorPlans: {
      type: String,
    },
    mapLocation: {
      type: String,
      required: true,
    },
    neighborhood: {
      type: [String],
      required: true,
    },
    addedBy: {
      type: ObjectId,
      required: true,
    },
    updatedBy: {
      type: ObjectId,
      required: true,
    },
  },
  { timestamps: true },
);

const Property = mongoose.model('Property', PropertySchema);

export default Property;
