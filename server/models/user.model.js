import mongoose from 'mongoose';

/**
 * @swagger
 *  components:
 *    schemas:
 *      User:
 *        type: object
 *        required:
 *          - firstName
 *          - lastName
 *          - email
 *          - password
 *          - confirmPassword
 *        properties:
 *          firstName:
 *            type: string
 *          lastName:
 *            type: string
 *          email:
 *            type: string
 *            format: email
 *            description: Email for the user, needs to be unique.
 *          password:
 *            type: string
 *          confirmPassword:
 *            type: string
 *            description: Should match password.
 *          phone:
 *            type: string
 *          phone2:
 *            type: string
 *          address:
 *            type: object
 *          preferences:
 *            type: object
 *          notification:
 *            type: array
 *        example:
 *           firstName: John
 *           lastName: Doe
 *           email: johndoe@email.com
 *           password: johnd007
 *           confirmPassword: johnd007
 *           phone: 08012345678
 *           phone2: 08012345678
 *           address: {street1: 1 sesame street, street2: 12 solomon close, city: Ikeja, state: Lagos, country: Nigeria}
 *           preferences: {houseType: 3 bedroom apartment, location: lekki phase 1, maxPrice: 50000000, minPrice: 15000000}
 *           notification: [description: Your account has been activated, type: info, URL: app.ballers.ng/dashboard, status: 0, dateAdded: 22-03-2021]
 */

const { ObjectId } = mongoose.Schema.Types;
const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    phone: String,
    phone2: String,
    address: {
      street1: {
        type: String,
      },
      street2: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      country: {
        type: String,
      },
    },
    preferences: {
      houseType: {
        type: String,
      },
      location: {
        type: String,
      },
      maxPrice: {
        type: Number,
      },
      minPrice: {
        type: Number,
      },
    },
    notification: [
      {
        description: {
          type: String,
        },
        type: {
          type: String,
        },
        URL: {
          type: String,
        },
        status: {
          type: Number,
        },
        dateAdded: Date,
      },
    ],
    referralCode: {
      type: String,
      unique: true,
    },
    role: {
      type: Number,
      default: 1,
    },
    assignedProperties: [
      {
        propertyId: ObjectId,
        assignedBy: ObjectId,
        assignedDate: Date,
        approved: {
          type: Boolean,
          default: false,
        },
        approvedBy: ObjectId,
        approvedDate: Date,
      },
    ],
    activated: {
      type: Boolean,
      default: false,
    },
    activationDate: Date,
  },
  { timestamps: true },
);

const User = mongoose.model('User', UserSchema);

export default User;
