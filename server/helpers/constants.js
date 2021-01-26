export const USER_ROLE = {
  ADMIN: 0,
  USER: 1,
  VENDOR: 2,
  EDITOR: 3,
};

export const OFFER_STATUS = {
  GENERATED: 'Generated',
  INTERESTED: 'Interested',
  ASSIGNED: 'Assigned',
  ALLOCATED: 'Allocated',
  REJECTED: 'Rejected',
  NEGLECTED: 'Neglected',
  CANCELLED: 'Cancelled',
};

export const REFERRAL_STATUS = {
  SENT: 'Sent',
  REGISTERED: 'Registered',
  REWARDED: 'Rewarded',
};

export const REWARD_STATUS = {
  PENDING: 'Pending',
  PROGRESS: 'Progress',
  PAID: 'Paid',
};

export const CONCERN_STATUS = {
  RESOLVED: 'Resolved',
  PENDING: 'Pending',
};

export const VENDOR_INFO_STATUS = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  IN_REVIEW: 'In Review',
};

export const VENDOR_STEPS = ['companyInfo', 'bankDetails', 'directorInfo', 'documentUpload'];

export const addressSchema = {
  city: {
    type: String,
  },
  country: {
    type: String,
  },
  state: {
    type: String,
  },
  street1: {
    type: String,
  },
  street2: {
    type: String,
  },
};

export const COMMENT_STATUS = {
  RESOLVED: 'Resolved',
  PENDING: 'Pending',
};
export const PROJECTED_PROPERTY_INFO = {
  name: 1,
  titleDocument: 1,
  address: 1,
  neighborhood: 1,
  mapLocation: 1,
  gallery: 1,
  mainImage: 1,
  price: 1,
  units: 1,
  houseType: 1,
  bedrooms: 1,
  toilets: 1,
  description: 1,
  paymentPlan: 1,
  floorPlans: 1,
};

export const PROJECTED_VENDOR_INFO = {
  'vendorInfo._id': 1,
  'vendorInfo.firstName': 1,
  'vendorInfo.lastName': 1,
  'vendorInfo.email': 1,
  'vendorInfo.phone': 1,
  'vendorInfo.vendor.companyLogo': 1,
  'vendorInfo.vendor.companyName': 1,
  'vendorInfo.vendor.socialMedia': 1,
  'vendorInfo.vendor.certified': 1,
  'vendorInfo.vendor.verified': 1,
  'vendorInfo.vendor.website': 1,
  'vendorInfo.vendor.vendorCode': 1,
};

export const PROJECTED_ASSIGNED_USER_INFO = {
  'assignedUsers._id': 1,
  'assignedUsers.firstName': 1,
  'assignedUsers.lastName': 1,
  'assignedUsers.email': 1,
};

export const NON_PROJECTED_USER_INFO = (infoType) => {
  return {
    'propertyInfo.assignedTo': 0,
    [`${infoType}.assignedProperties`]: 0,
    [`${infoType}.favorites`]: 0,
    [`${infoType}.banned:`]: 0,
    [`${infoType}.password`]: 0,
    [`${infoType}.referralCode`]: 0,
    [`${infoType}.role`]: 0,
    [`${infoType}.notifications`]: 0,
    [`${infoType}.vendor.bankInfo`]: 0,
    [`${infoType}.vendor.directors`]: 0,
    [`${infoType}.vendor.identification`]: 0,
    [`${infoType}.vendor.verification`]: 0,
    [`${infoType}.vendor.entity`]: 0,
    [`${infoType}.vendor.redanNumber`]: 0,
    [`${infoType}.vendor.taxCertificate`]: 0,
  };
};
