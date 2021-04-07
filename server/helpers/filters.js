import { add } from 'date-fns';
import mongoose from 'mongoose';

const { ObjectId } = mongoose.Types.ObjectId;
const RANGE_SEPARATOR = ':';
const ARRAY_SEPARATOR = ',';

export const FILTER_TYPE = {
  ARRAY: 'array',
  BOOLEAN: 'boolean',
  DATE: 'date',
  INTEGER: 'integer',
  OBJECT_ID: 'objectId',
  STRING: 'string',
};

const SORT_DIRECTION = {
  ASC: 1,
  DESC: -1,
};

const RANGE_TYPE = {
  EQUALS: 1,
  TO: 2,
  FROM: 3,
  RANGE: 4,
};

const processRangeSeparator = (key) => {
  if (key.includes(RANGE_SEPARATOR)) {
    const [rangeFrom = 0, rangeTo = 0] = key.split(RANGE_SEPARATOR);

    if (parseInt(rangeFrom, 10) !== 0 && parseInt(rangeTo, 10) !== 0) {
      return RANGE_TYPE.RANGE;
    }

    if (parseInt(rangeFrom, 10) === 0) {
      return RANGE_TYPE.TO;
    }

    if (parseInt(rangeTo, 10) === 0) {
      return RANGE_TYPE.FROM;
    }
  }

  return RANGE_TYPE.EQUALS;
};

export const buildFilterQuery = (allFilters, query) => {
  return Object.entries(allFilters).reduce((acc, [queryKey, { key, type }]) => {
    const filterKey = key || queryKey;

    if (query[queryKey]) {
      const [rangeFrom = 0, rangeTo = 0] = query[queryKey].split(RANGE_SEPARATOR);

      switch (type) {
        case FILTER_TYPE.ARRAY:
          acc.push({ [filterKey]: { $all: query[queryKey].split(ARRAY_SEPARATOR) } });
          break;

        case FILTER_TYPE.BOOLEAN:
          acc.push({ [filterKey]: query[queryKey] === 'true' });
          break;

        case FILTER_TYPE.DATE:
          {
            let dateQueryValue;
            const rangeType = processRangeSeparator(query[queryKey]);

            switch (rangeType) {
              case RANGE_TYPE.EQUALS:
                dateQueryValue = {
                  $gte: add(new Date(query[queryKey]), { days: 0 }),
                  $lt: add(new Date(query[queryKey]), { days: 1 }),
                };
                break;

              case RANGE_TYPE.RANGE:
                dateQueryValue = {
                  $gte: add(new Date(rangeFrom), { days: 0 }),
                  $lt: add(new Date(rangeTo), { days: 1 }),
                };
                break;

              case RANGE_TYPE.FROM:
                dateQueryValue = {
                  $gte: add(new Date(rangeFrom), { days: 0 }),
                };
                break;

              case RANGE_TYPE.TO:
                dateQueryValue = {
                  $lt: add(new Date(rangeTo), { days: 1 }),
                };
                break;

              default:
                break;
            }
            acc.push({ [filterKey]: dateQueryValue });
          }
          break;

        case FILTER_TYPE.INTEGER:
          {
            let integerQueryValue;
            const rangeType = processRangeSeparator(query[queryKey]);

            switch (rangeType) {
              case RANGE_TYPE.EQUALS:
                integerQueryValue = parseInt(query[queryKey], 10);
                break;

              case RANGE_TYPE.RANGE:
                integerQueryValue = {
                  $gte: parseInt(rangeFrom, 10),
                  $lte: parseInt(rangeTo, 10),
                };
                break;

              case RANGE_TYPE.FROM:
                integerQueryValue = {
                  $gte: parseInt(rangeFrom, 10),
                };
                break;

              case RANGE_TYPE.TO:
                integerQueryValue = {
                  $lte: parseInt(rangeTo, 10),
                };
                break;

              default:
                break;
            }
            acc.push({ [filterKey]: integerQueryValue });
          }
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

export const buildSortQuery = (modelFilter, query) => {
  const { sortBy, sortDirection } = query;

  if (sortBy && Object.keys(modelFilter).includes(sortBy)) {
    const direction =
      sortDirection?.toUpperCase() === 'DESC' ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC;

    const key = modelFilter[sortBy].key || sortBy;
    return { [key]: direction };
  }
  return {};
};

export const buildFilterAndSortQuery = (allFilters, query) => ({
  filterQuery: buildFilterQuery(allFilters, query),
  sortQuery: buildSortQuery(allFilters, query),
});

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
  features: { type: FILTER_TYPE.ARRAY },
  houseType: { type: FILTER_TYPE.STRING },
  name: { type: FILTER_TYPE.STRING },
  price: { type: FILTER_TYPE.INTEGER },
  toilets: { type: FILTER_TYPE.INTEGER },
  units: { type: FILTER_TYPE.INTEGER },
  flagged: { key: 'flagged.status', type: FILTER_TYPE.BOOLEAN },
};

export const OFFER_FILTERS = {
  allocationInPercentage: { type: FILTER_TYPE.INTEGER },
  contributionReward: { type: FILTER_TYPE.INTEGER },
  createdAt: { type: FILTER_TYPE.DATE },
  deliveryState: { type: FILTER_TYPE.STRING },
  expires: { type: FILTER_TYPE.DATE },
  handOverDate: { type: FILTER_TYPE.DATE },
  initialPayment: { type: FILTER_TYPE.INTEGER },
  periodicPayment: { type: FILTER_TYPE.INTEGER },
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

export const REPORT_FILTERS = {
  createdAt: { type: FILTER_TYPE.DATE },
  propertyId: { type: FILTER_TYPE.OBJECT_ID },
  reportedBy: { type: FILTER_TYPE.OBJECT_ID },
  resolvedBy: { key: 'resolved.by', type: FILTER_TYPE.OBJECT_ID },
  resolvedDate: { key: 'resolved.date', type: FILTER_TYPE.DATE },
  status: { key: 'resolved.status', type: FILTER_TYPE.BOOLEAN },
};

export const OFFLINE_PAYMENT_FILTERS = {
  amount: { type: FILTER_TYPE.INTEGER },
  bank: { type: FILTER_TYPE.STRING },
  createdAt: { type: FILTER_TYPE.DATE },
  dateOfPayment: { type: FILTER_TYPE.DATE },
  offerId: { type: FILTER_TYPE.OBJECT_ID },
  resolved: { key: 'resolved.status', type: FILTER_TYPE.BOOLEAN },
  resolvedBy: { key: 'resolved.by', type: FILTER_TYPE.OBJECT_ID },
  resolvedOn: { key: 'resolved.date', type: FILTER_TYPE.DATE },
  type: { type: FILTER_TYPE.STRING },
};
