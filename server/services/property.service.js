import mongoose from 'mongoose';
import Property from '../models/property.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import Transaction from '../models/transaction.model';
// eslint-disable-next-line import/no-cycle
import { getOffer } from './offer.service';
import { OFFER_STATUS, USER_ROLE } from '../helpers/constants';
import Offer from '../models/offer.model';
import {
  PROJECTED_VENDOR_INFO,
  PROJECTED_PROPERTY_INFO,
  PROJECTED_ASSIGNED_USER_INFO,
} from '../helpers/projectedSchemaInfo';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';
import { buildFilterQuery, PROPERTY_FILTERS } from '../helpers/filters';

const { ObjectId } = mongoose.Types.ObjectId;

export const getPropertyById = async (id) => Property.findById(id).select();

export const addProperty = async (property) => {
  try {
    const addedProperty = await new Property(property).save();
    return addedProperty;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding property', error);
  }
};

export const updateProperty = async (updatedProperty) => {
  const property = await getPropertyById(updatedProperty.id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  try {
    if (updatedProperty.vendor._id.toString() !== property.addedBy.toString()) {
      throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
    }

    return Property.findByIdAndUpdate(property.id, updatedProperty, { new: true });
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error updating property', error);
  }
};

export const deleteProperty = async ({ propertyId, user }) => {
  const property = await getPropertyById(propertyId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  try {
    if (user.role === USER_ROLE.VENDOR && user._id.toString() !== property.addedBy.toString()) {
      throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
    }

    return Property.findByIdAndDelete(property.id);
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error deleting property', error);
  }
};

export const getAllPropertiesAddedByVendor = async (vendorId) =>
  Property.aggregate([
    { $match: { addedBy: ObjectId(vendorId) } },
    {
      $lookup: {
        from: 'users',
        localField: 'assignedTo',
        foreignField: '_id',
        as: 'assignedUsers',
      },
    },
    {
      $lookup: {
        from: 'paymentplans',
        localField: 'paymentPlan',
        foreignField: '_id',
        as: 'paymentPlan',
      },
    },
    {
      $project: {
        ...PROJECTED_PROPERTY_INFO,
        ...PROJECTED_ASSIGNED_USER_INFO,
      },
    },
  ]);

export const getAllProperties = async (user, { page = 1, limit = 10, ...query } = {}) => {
  const filterQuery = buildFilterQuery(PROPERTY_FILTERS, query);

  const propertiesOptions = [
    { $match: { $and: filterQuery } },
    {
      $lookup: {
        from: 'users',
        localField: 'assignedTo',
        foreignField: '_id',
        as: 'assignedUsers',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'addedBy',
        foreignField: '_id',
        as: 'vendorInfo',
      },
    },
    {
      $lookup: {
        from: 'paymentplans',
        localField: 'paymentPlan',
        foreignField: '_id',
        as: 'paymentPlan',
      },
    },
    {
      $unwind: '$vendorInfo',
    },
    {
      $project: {
        ...PROJECTED_PROPERTY_INFO,
        ...PROJECTED_VENDOR_INFO,
        ...PROJECTED_ASSIGNED_USER_INFO,
      },
    },
    {
      $facet: {
        metadata: [{ $count: 'total' }, { $addFields: { page, limit } }],
        data: generateFacetData(page, limit),
      },
    },
  ];

  if (filterQuery.length < 1) {
    propertiesOptions.shift();
  }

  if (user.role === USER_ROLE.VENDOR) {
    propertiesOptions.unshift({ $match: { addedBy: ObjectId(user._id) } });
  }

  const properties = await Property.aggregate(propertiesOptions);

  const total = getPaginationTotal(properties);
  const pagination = generatePagination(page, limit, total);
  const result = properties[0].data;
  return { pagination, result };
};

export const getOneProperty = async (propertyId, user = {}) => {
  const propertyOptions = [
    { $match: { _id: ObjectId(propertyId) } },
    {
      $lookup: {
        from: 'users',
        localField: 'addedBy',
        foreignField: '_id',
        as: 'vendorInfo',
      },
    },
    {
      $lookup: {
        from: 'paymentplans',
        localField: 'paymentPlan',
        foreignField: '_id',
        as: 'paymentPlan',
      },
    },
    {
      $unwind: '$vendorInfo',
    },
    {
      $project: {
        ...PROJECTED_PROPERTY_INFO,
        ...PROJECTED_VENDOR_INFO,
      },
    },
  ];

  if (user?.role === USER_ROLE.USER) {
    propertyOptions.splice(
      1,
      0,
      {
        $lookup: {
          from: 'enquiries',
          let: { propPropertyId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$propertyId', '$$propPropertyId'] },
                    { $eq: ['$userId', ObjectId(user._id)] },
                  ],
                },
              },
            },
          ],
          as: 'enquiryInfo',
        },
      },
      {
        $lookup: {
          from: 'visitations',
          let: { propPropertyId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$propertyId', '$$propPropertyId'] },
                    { $eq: ['$userId', ObjectId(user._id)] },
                  ],
                },
              },
            },
          ],
          as: 'visitationInfo',
        },
      },
    );
    propertyOptions.splice(propertyOptions.length - 1, 0, {
      $unwind: {
        path: '$enquiryInfo',
        preserveNullAndEmptyArrays: true,
      },
    });
    propertyOptions[propertyOptions.length - 1].$project = {
      ...propertyOptions[propertyOptions.length - 1].$project,
      enquiryInfo: 1,
      visitationInfo: 1,
    };
  }

  const property = await Property.aggregate(propertyOptions);
  return property;
};

export const searchThroughProperties = async ({
  userId,
  state,
  city,
  houseType,
  minPrice,
  maxPrice,
}) =>
  Property.aggregate([
    { $match: { assignedTo: { $nin: [ObjectId(userId)] } } },
    {
      $match: {
        $and: [
          { 'address.state': state || /.*/ },
          { 'address.city': city || /.*/ },
          { houseType: houseType || /.*/ },
          {
            price: {
              $gte: minPrice || 0,
              $lte: maxPrice || 10000000000000,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'assignedTo',
        foreignField: '_id',
        as: 'assignedUsers',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'addedBy',
        foreignField: '_id',
        as: 'vendorInfo',
      },
    },
    {
      $unwind: '$vendorInfo',
    },
    {
      $project: {
        ...PROJECTED_PROPERTY_INFO,
        ...PROJECTED_VENDOR_INFO,
        ...PROJECTED_ASSIGNED_USER_INFO,
      },
    },
  ]);

export const getAvailablePropertyOptions = async () =>
  Property.aggregate([
    {
      $group: {
        _id: null,
        houseTypes: { $addToSet: '$houseType' },
        states: { $addToSet: '$address.state' },
      },
    },
  ]);

export const getPropertiesWithPaymentPlanId = async (id) =>
  Property.find({ paymentPlan: { $in: [id] } });

export const getTotalAmountPaidForProperty = async (offerId) =>
  Transaction.aggregate([
    { $match: { offerId: ObjectId(offerId) } },
    {
      $lookup: {
        from: 'properties',
        localField: 'propertyId',
        foreignField: '_id',
        as: 'property',
      },
    },
    {
      $unwind: '$property',
    },
    {
      $group: {
        _id: '$property._id',
        totalAmountContributed: { $sum: '$amount' },
      },
    },
  ]);

export const getAssignedPropertyByOfferId = async (offerId, user) => {
  const total = await getTotalAmountPaidForProperty(offerId);
  const totalPaid = total.length > 0 ? total[0].totalAmountContributed : 0;

  const offer = await getOffer(offerId, user);

  return {
    totalPaid,
    offer: offer[0],
  };
};

export const getAssignedProperties = async (userId) =>
  Offer.aggregate([
    { $match: { userId: ObjectId(userId) } },
    {
      $match: {
        $or: [
          { status: OFFER_STATUS.ASSIGNED },
          { status: OFFER_STATUS.ALLOCATED },
          { status: OFFER_STATUS.INTERESTED },
        ],
      },
    },
    {
      $lookup: {
        from: 'properties',
        localField: 'propertyId',
        foreignField: '_id',
        as: 'property',
      },
    },
    {
      $unwind: '$property',
    },
  ]);

export const addNeighborhood = async (neighborhoodInfo) => {
  const property = await getPropertyById(neighborhoodInfo.propertyId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!property) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid property');
  }

  if (neighborhoodInfo.vendorId.toString() !== property.addedBy.toString()) {
    throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
  }

  try {
    return Property.findByIdAndUpdate(
      property._id,
      { $push: { [`neighborhood.${neighborhoodInfo.type}`]: neighborhoodInfo.neighborhood } },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error addding neighborhood', error);
  }
};

export const updateNeighborhood = async (updatedNeighborhood) => {
  const property = await getPropertyById(updatedNeighborhood.propertyId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!property) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid property');
  }

  if (updatedNeighborhood.vendorId.toString() !== property.addedBy.toString()) {
    throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
  }

  try {
    return Property.findOneAndUpdate(
      { [`neighborhood.${updatedNeighborhood.type}._id`]: updatedNeighborhood.typeId },
      {
        $set: {
          [`neighborhood.${updatedNeighborhood.type}.$.name`]: updatedNeighborhood.neighborhood
            .name,
          [`neighborhood.${updatedNeighborhood.type}.$.timeAwayFromProperty`]: updatedNeighborhood
            .neighborhood.timeAwayFromProperty,
          [`neighborhood.${updatedNeighborhood.type}.$.mapLocation.latitude`]: updatedNeighborhood
            .neighborhood.mapLocation.latitude,
          [`neighborhood.${updatedNeighborhood.type}.$.mapLocation.longitude`]: updatedNeighborhood
            .neighborhood.mapLocation.longitude,
        },
      },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error updating neighborhood', error);
  }
};

export const deleteNeighborhood = async (neighborhoodInfo) => {
  const property = await getPropertyById(neighborhoodInfo.propertyId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!property) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid property');
  }

  if (neighborhoodInfo.vendorId.toString() !== property.addedBy.toString()) {
    throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
  }

  try {
    return Property.findByIdAndUpdate(
      property._id,
      { $pull: { [`neighborhood.${neighborhoodInfo.type}`]: { _id: neighborhoodInfo.typeId } } },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error deleting neighborhood', error);
  }
};
