import { parse, add } from 'date-fns';
import mongoose from 'mongoose';

const { ObjectId } = mongoose.Types.ObjectId;

export const FILTER_TYPE = {
  BOOLEAN: 'boolean',
  DATE: 'date',
  INTEGER: 'integer',
  OBJECT_ID: 'objectId',
  STRING: 'string',
};

const SORT_DIRECTION = {
  ASC: 1,
  DES: -1,
};

export const buildFilterQuery = (allFilters, query) => {
  return Object.entries(allFilters).reduce((acc, [queryKey, { key, type }]) => {
    const filterKey = key || queryKey;

    if (query[queryKey]) {
      switch (type) {
        case FILTER_TYPE.BOOLEAN:
          acc.push({ [filterKey]: query[queryKey] === 'true' });
          break;

        case FILTER_TYPE.DATE:
          acc.push({
            [filterKey]: {
              $gte: parse(query[queryKey], 'yyyy-MM-dd', new Date()),
              $lt: add(new Date(query[queryKey]), { days: 1 }),
            },
          });
          break;

        case FILTER_TYPE.INTEGER:
          acc.push({ [filterKey]: parseInt(query[queryKey], 10) });
          break;

        case FILTER_TYPE.OBJECT_ID:
          acc.push({ [filterKey]: ObjectId(query[queryKey]) });
          break;

        case FILTER_TYPE.STRING:
          acc.push({ [filterKey]: { $regex: query[queryKey], $options: 'i' } });
          break;

        default:
          break;
      }
    }
    return acc;
  }, []);
};

export const buildSortQuery = (sortFilter, query) => {
  return Object.entries(sortFilter).reduce((acc, [queryKey, { type }]) => {
    if (query[queryKey]) {
      switch (type) {
        case 'key':
          acc.key = query[queryKey];
          break;

        case 'value':
          acc.value = SORT_DIRECTION[query[queryKey].toUpperCase()];
          break;

        default:
          break;
      }
    }
    return acc;
  }, {});
};

export const ADDRESS_FILTERS = {
  city: { key: 'address.city', type: FILTER_TYPE.STRING },
  country: { key: 'address.country', type: FILTER_TYPE.STRING },
  state: { key: 'address.state', type: FILTER_TYPE.STRING },
  street1: { key: 'address.street1', type: FILTER_TYPE.STRING },
  street2: { key: 'address.street2', type: FILTER_TYPE.STRING },
};

export const USER_FILTERS = {
  ...ADDRESS_FILTERS,
  activated: { type: FILTER_TYPE.BOOLEAN },
  activationDate: { type: FILTER_TYPE.DATE },
  banned: { key: 'banned.status', type: FILTER_TYPE.BOOLEAN },
  bankDetailsStatus: { key: 'vendor.verification.bankDetails.status', type: FILTER_TYPE.STRING },
  certified: { key: 'vendor.certified', type: FILTER_TYPE.BOOLEAN },
  certifiedOn: { key: 'vendor.certifiedOn', type: FILTER_TYPE.DATE },
  companyInfoStatus: { key: 'vendor.verification.companyInfo.status', type: FILTER_TYPE.STRING },
  companyName: { key: 'vendor.companyName', type: FILTER_TYPE.STRING },
  createdAt: { type: FILTER_TYPE.DATE },
  directorInfoStatus: { key: 'vendor.verification.directorInfo.status', type: FILTER_TYPE.STRING },
  documentUploadStatus: {
    key: 'vendor.verification.documentUpload.status',
    type: FILTER_TYPE.STRING,
  },
  email: { type: FILTER_TYPE.STRING },
  entity: { key: 'vendor.entity', type: FILTER_TYPE.STRING },
  firstName: { type: FILTER_TYPE.STRING },
  lastName: { type: FILTER_TYPE.STRING },
  phone: { type: FILTER_TYPE.STRING },
  phone2: { type: FILTER_TYPE.STRING },
  referralCode: { type: FILTER_TYPE.STRING },
  redanNumber: { key: 'vendor.redanNumber', type: FILTER_TYPE.STRING },
  role: { type: FILTER_TYPE.INTEGER },
  verified: { key: 'vendor.verified', type: FILTER_TYPE.BOOLEAN },
  verifiedOn: { key: 'vendor.verifiedOn', type: FILTER_TYPE.DATE },
};

export const PROPERTY_FILTERS = {
  ...ADDRESS_FILTERS,
  addedBy: { type: FILTER_TYPE.OBJECT_ID },
  bathrooms: { type: FILTER_TYPE.INTEGER },
  bedrooms: { type: FILTER_TYPE.INTEGER },
  createdAt: { type: FILTER_TYPE.DATE },
  houseType: { type: FILTER_TYPE.STRING },
  name: { type: FILTER_TYPE.STRING },
  price: { type: FILTER_TYPE.INTEGER },
  toilets: { type: FILTER_TYPE.INTEGER },
  units: { type: FILTER_TYPE.INTEGER },
};

export const OFFER_FILTERS = {
  allocationInPercentage: { type: FILTER_TYPE.INTEGER },
  contributionReward: { type: FILTER_TYPE.INTEGER },
  createdAt: { type: FILTER_TYPE.DATE },
  deliveryState: { type: FILTER_TYPE.STRING },
  expires: { type: FILTER_TYPE.DATE },
  handOverDate: { type: FILTER_TYPE.DATE },
  initialPayment: { type: FILTER_TYPE.INTEGER },
  monthlyPayment: { type: FILTER_TYPE.INTEGER },
  paymentFrequency: { type: FILTER_TYPE.INTEGER },
  propertyId: { type: FILTER_TYPE.OBJECT_ID },
  referenceCode: { type: FILTER_TYPE.STRING },
  status: { type: FILTER_TYPE.STRING },
  title: { type: FILTER_TYPE.STRING },
  totalAmountPayable: { type: FILTER_TYPE.INTEGER },
  userId: { type: FILTER_TYPE.OBJECT_ID },
  vendorId: { type: FILTER_TYPE.OBJECT_ID },
};

export const ENQUIRY_FILTERS = {
  ...ADDRESS_FILTERS,
  approved: { type: FILTER_TYPE.BOOLEAN },
  approvalDate: { type: FILTER_TYPE.DATE },
  createdAt: { type: FILTER_TYPE.DATE },
  email: { type: FILTER_TYPE.STRING },
  firstName: { type: FILTER_TYPE.STRING },
  initialInvestmentAmount: { type: FILTER_TYPE.INTEGER },
  investmentFrequency: { type: FILTER_TYPE.STRING },
  investmentStartDate: { type: FILTER_TYPE.DATE },
  lastName: { type: FILTER_TYPE.STRING },
  nameOnTitleDocument: { type: FILTER_TYPE.STRING },
  occupation: { type: FILTER_TYPE.STRING },
  periodicInvestmentAmount: { type: FILTER_TYPE.INTEGER },
  phone: { type: FILTER_TYPE.STRING },
  phone2: { type: FILTER_TYPE.STRING },
  propertyId: { type: FILTER_TYPE.OBJECT_ID },
  title: { type: FILTER_TYPE.STRING },
  userId: { type: FILTER_TYPE.OBJECT_ID },
  vendorId: { type: FILTER_TYPE.OBJECT_ID },
};

export const VISITATION_FILTERS = {
  createdAt: { type: FILTER_TYPE.DATE },
  vendorId: { type: FILTER_TYPE.OBJECT_ID },
  propertyId: { type: FILTER_TYPE.OBJECT_ID },
  status: { type: FILTER_TYPE.STRING },
  userId: { type: FILTER_TYPE.OBJECT_ID },
  visitDate: { type: FILTER_TYPE.DATE },
  visitorEmail: { type: FILTER_TYPE.STRING },
  visitorName: { type: FILTER_TYPE.STRING },
  visitorPhone: { type: FILTER_TYPE.STRING },
};

export const SORT_FILTERS = {
  sortBy: { type: 'key' },
  sortDirection: { type: 'value' },
};
