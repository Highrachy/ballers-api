import mongoose from 'mongoose';
import { USER_ROLE, VENDOR_INFO_STATUS, addressSchema, COMMENT_STATUS } from '../helpers/constants';

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
 *          favourites:
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
 *           preferences: {houseType: 3 bedroom apartment, location: lekki phase 1, maxPrice: 50000000, minPrice: 15000000, paymentPlan: Outright Payment}
 *           favourites: []
 */

const { ObjectId } = mongoose.Schema.Types;
const vendorInfoSchema = {
  comments: [
    {
      comment: {
        type: String,
      },
      status: {
        type: String,
        default: COMMENT_STATUS.PENDING,
      },
      addedBy: {
        type: ObjectId,
      },
    },
  ],
  status: {
    type: String,
    default: VENDOR_INFO_STATUS.PENDING,
  },
  verifiedBy: {
    type: ObjectId,
  },
  verifiedOn: {
    type: Date,
  },
};

const changedEntry = {
  old: {
    type: String,
  },
  new: {
    type: String,
  },
};

const UserSchema = new mongoose.Schema(
  {
    activated: {
      type: Boolean,
      default: false,
    },
    activationDate: Date,
    address: addressSchema,
    additionalInfo: {
      bankInfo: {
        accountName: {
          type: String,
        },
        accountNumber: {
          type: String,
        },
        bankName: {
          type: String,
        },
      },
      referralPercentage: {
        type: Number,
      },
    },
    banned: {
      status: {
        type: Boolean,
        default: false,
      },
      case: [
        {
          bannedBy: {
            type: ObjectId,
          },
          bannedDate: {
            type: Date,
          },
          bannedReason: {
            type: String,
          },
          unBannedBy: {
            type: ObjectId,
          },
          unBannedDate: {
            type: Date,
          },
          unBannedReason: {
            type: String,
          },
        },
      ],
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    favorites: {
      type: [ObjectId],
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    phone: String,
    phone2: String,
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
      paymentPlan: {
        String,
      },
    },
    profileImage: {
      type: String,
    },
    referralCode: {
      type: String,
      unique: true,
    },
    role: {
      type: Number,
      default: USER_ROLE.USER,
    },
    vendor: {
      bankInfo: {
        accountName: {
          type: String,
        },
        accountNumber: {
          type: String,
        },
        bankName: {
          type: String,
        },
      },
      certified: {
        type: Boolean,
        default: false,
      },
      certifiedBy: {
        type: ObjectId,
      },
      certifiedOn: {
        type: Date,
      },
      companyLogo: {
        type: String,
      },
      companyName: {
        type: String,
      },
      directors: [
        {
          name: {
            type: String,
          },
          isSignatory: {
            type: Boolean,
          },
          signature: {
            type: String,
          },
          phone: {
            type: String,
          },
        },
      ],
      entity: {
        type: String,
      },
      identification: {
        url: {
          type: String,
        },
        type: {
          type: String,
        },
      },
      redanNumber: {
        type: String,
      },
      socialMedia: [
        {
          name: {
            type: String,
          },
          url: {
            type: String,
          },
        },
      ],
      taxCertificate: {
        type: String,
      },
      vendorCode: {
        type: String,
      },
      verified: {
        type: Boolean,
        default: false,
      },
      verifiedBy: {
        type: ObjectId,
      },
      verifiedOn: {
        type: Date,
      },
      website: {
        type: String,
      },
      verification: {
        companyInfo: vendorInfoSchema,
        bankDetails: vendorInfoSchema,
        documentUpload: vendorInfoSchema,
        directorInfo: vendorInfoSchema,
      },
      logs: [
        {
          bankInfo: changedEntry,
          companyName: changedEntry,
          entity: changedEntry,
          identification: changedEntry,
          phone: changedEntry,
          redanNumber: changedEntry,
          taxCertificate: changedEntry,
          updatedAt: Date,
        },
      ],
      remittancePercentage: {
        type: Number,
        default: 5,
      },
    },
  },
  { timestamps: true },
  { collation: { locale: 'en', strength: 2 } },
);

const User = mongoose.model('User', UserSchema);

export default User;
