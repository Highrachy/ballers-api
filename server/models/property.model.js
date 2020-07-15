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
 *          - mainImage
 *          - gallery
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
 *            type: object
 *          neighborhood:
 *            type: string
 *          mainImage:
 *            type: string
 *          gallery:
 *            type: array
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
 *           mapLocation: {longitude: 1.23456, latitude: 2.34567}
 *           neighborhood: ['Lekki Phase 1']
 *           mainImage: https://picsum.photos/200
 *           gallery: ['https://picsum.photos/200', 'https://picsum.photos/200', 'https://picsum.photos/200']
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
      longitude: {
        type: String,
      },
      latitude: {
        type: String,
      },
    },
    neighborhood: {
      type: [String],
    },
    mainImage: {
      type: String,
      required: true,
    },
    gallery: {
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
