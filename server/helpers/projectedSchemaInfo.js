import { USER_ROLE } from './constants';

export const PROJECTED_PROPERTY_INFO = {
  name: 1,
  titleDocument: 1,
  address: 1,
  neighborhood: 1,
  mapLocation: 1,
  gallery: 1,
  mainImage: 1,
  features: 1,
  price: 1,
  units: 1,
  houseType: 1,
  bedrooms: 1,
  bathrooms: 1,
  toilets: 1,
  description: 1,
  paymentPlan: 1,
  floorPlans: 1,
  createdAt: 1,
  addedBy: 1,
  flagged: 1,
};

export const EXCLUDED_PROPERTY_INFO = {
  assignedTo: 0,
};

export const PROJECTED_VENDOR_INFO = {
  'vendorInfo._id': 1,
  'vendorInfo.firstName': 1,
  'vendorInfo.lastName': 1,
  'vendorInfo.email': 1,
  'vendorInfo.phone': 1,
  'vendorInfo.address': 1,
  'vendorInfo.vendor.companyLogo': 1,
  'vendorInfo.vendor.companyName': 1,
  'vendorInfo.vendor.socialMedia': 1,
  'vendorInfo.vendor.certified': 1,
  'vendorInfo.vendor.verified': 1,
  'vendorInfo.vendor.website': 1,
  'vendorInfo.vendor.vendorCode': 1,
  'vendorInfo.vendor.directors': {
    name: 1,
    signature: 1,
  },
};

export const PROJECTED_ASSIGNED_USER_INFO = {
  'assignedUsers._id': 1,
  'assignedUsers.firstName': 1,
  'assignedUsers.lastName': 1,
  'assignedUsers.email': 1,
};

export const NON_PROJECTED_USER_INFO = (infoType, userRole = null) => {
  const remittance =
    userRole !== USER_ROLE.ADMIN
      ? { [`${infoType}.vendor.remittancePercentage`]: 0, [`${infoType}.vendor.bankInfo`]: 0 }
      : {};

  return {
    'propertyInfo.assignedTo': 0,
    [`${infoType}.assignedProperties`]: 0,
    [`${infoType}.favorites`]: 0,
    [`${infoType}.banned:`]: 0,
    [`${infoType}.password`]: 0,
    [`${infoType}.referralCode`]: 0,
    [`${infoType}.role`]: 0,
    [`${infoType}.notifications`]: 0,
    [`${infoType}.vendor.logs`]: 0,
    [`${infoType}.vendor.directors`]: { phone: 0 },
    [`${infoType}.vendor.identification`]: 0,
    [`${infoType}.vendor.verification`]: 0,
    [`${infoType}.vendor.entity`]: 0,
    [`${infoType}.vendor.redanNumber`]: 0,
    [`${infoType}.vendor.taxCertificate`]: 0,
    ...remittance,
  };
};

export const getExcludedTransactionInfo = (userRole) =>
  userRole === USER_ROLE.USER ? { remittance: 0 } : {};
