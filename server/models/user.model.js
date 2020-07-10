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
 *        example:
 *           firstName: John
 *           lastName: Doe
 *           email: johndoe@email.com
 *           password: johnd007
 *           confirmPassword: johnd007
 *           phone: 08012345678
 */

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
    role: {
      type: Number,
      default: 1,
    },
    assignedProperties: [
      {
        propertyId: String,
        assignedBy: String,
        assignedDate: Date,
        approved: {
          type: Boolean,
          default: false,
        },
        approvedBy: String,
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
