import mongoose from 'mongoose';
import Property from '../models/property.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import Transaction from '../models/transaction.model';
import { VALID_PORTFOLIO_OFFER, USER_ROLE } from '../helpers/constants';
import Offer from '../models/offer.model';
import {
  PROJECTED_VENDOR_INFO,
  PROJECTED_PROPERTY_INFO,
  PROJECTED_ASSIGNED_USER_INFO,
  NON_PROJECTED_USER_INFO,
} from '../helpers/projectedSchemaInfo';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';
import {
  PROPERTY_FILTERS,
  OFFER_FILTERS,
  SEARCH_FILTERS,
  buildFilterAndSortQuery,
} from '../helpers/filters';
// eslint-disable-next-line import/no-cycle
import { resolveReport, getReportById } from './reportedProperty.service';
// eslint-disable-next-line import/no-cycle
import { getUserById } from './user.service';
import { createNotification } from './notification.service';
import NOTIFICATIONS from '../helpers/notifications';
import { getFormattedName } from '../helpers/funtions';

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
  const { filterQuery, sortQuery } = buildFilterAndSortQuery(PROPERTY_FILTERS, query);

  const propertiesOptions = [
    { $match: { $and: filterQuery } },
    { $sort: sortQuery },
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

  if (Object.keys(sortQuery).length === 0) {
    propertiesOptions.splice(1, 1);
  }

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
    propertyOptions.splice(1, 0, {
      $match: {
        'flagged.status': false,
        'approved.status': true,
      },
    });
    propertyOptions.splice(
      2,
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
  if (
    property.length === 0 ||
    (user?.role === USER_ROLE.VENDOR && user?._id.toString() !== property[0].addedBy.toString())
  ) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Property not found');
  }
  return property[0];
};

export const searchThroughProperties = async (user, { page = 1, limit = 10, ...query } = {}) => {
  const { filterQuery, sortQuery } = buildFilterAndSortQuery(SEARCH_FILTERS, query);

  const propertyOptions = [
    { $match: { $and: filterQuery } },
    { $sort: sortQuery },
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
    {
      $facet: {
        metadata: [{ $count: 'total' }, { $addFields: { page, limit } }],
        data: generateFacetData(page, limit),
      },
    },
  ];

  if (Object.keys(sortQuery).length === 0) {
    propertyOptions.splice(1, 1);
  }

  if (filterQuery.length < 1) {
    propertyOptions.shift();
  }

  if (user.role === USER_ROLE.USER) {
    propertyOptions.unshift({
      $match: {
        assignedTo: { $nin: [ObjectId(user._id)] },
        'flagged.status': false,
        'approved.status': true,
      },
    });
  }

  const properties = await Property.aggregate(propertyOptions);

  const total = getPaginationTotal(properties);
  const pagination = generatePagination(page, limit, total);
  const result = properties[0].data;
  return { pagination, result };
};

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

export const getAllPortfolios = async (user, { page = 1, limit = 10, ...query } = {}) => {
  const matchKey = user.role === USER_ROLE.USER ? 'userId' : 'vendorId';
  const { filterQuery, sortQuery } = buildFilterAndSortQuery(OFFER_FILTERS, query);

  const portfolioOptions = [
    { $match: { $and: filterQuery } },
    { $sort: sortQuery },
    { $match: { $or: VALID_PORTFOLIO_OFFER } },
    {
      $lookup: {
        from: 'properties',
        localField: 'propertyId',
        foreignField: '_id',
        as: 'propertyInfo',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'vendorId',
        foreignField: '_id',
        as: 'vendorInfo',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userInfo',
      },
    },
    {
      $lookup: {
        from: 'nextpayments',
        let: { oOfferId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$offerId', '$$oOfferId'] }, { $eq: ['$resolved', false] }],
              },
            },
          },
        ],
        as: 'nextPaymentInfo',
      },
    },
    { $unwind: '$userInfo' },
    { $unwind: '$vendorInfo' },
    { $unwind: '$propertyInfo' },
    {
      $project: {
        ...NON_PROJECTED_USER_INFO('vendorInfo'),
        ...NON_PROJECTED_USER_INFO('userInfo'),
      },
    },
    {
      $facet: {
        metadata: [{ $count: 'total' }, { $addFields: { page, limit } }],
        data: generateFacetData(page, limit),
      },
    },
  ];

  if (Object.keys(sortQuery).length === 0) {
    portfolioOptions.splice(1, 1);
  }

  if (filterQuery.length < 1) {
    portfolioOptions.shift();
  }

  if (user.role !== USER_ROLE.ADMIN) {
    portfolioOptions.unshift({ $match: { [matchKey]: ObjectId(user._id) } });
  }

  const portfolio = await Offer.aggregate(portfolioOptions);

  const total = getPaginationTotal(portfolio);
  const pagination = generatePagination(page, limit, total);
  const result = portfolio[0].data;
  return { pagination, result };
};

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

  let data = {
    [`neighborhood.${updatedNeighborhood.type}.$.name`]: updatedNeighborhood.neighborhood.name,
    [`neighborhood.${updatedNeighborhood.type}.$.distance`]: updatedNeighborhood.neighborhood
      .distance,
  };

  if (updatedNeighborhood.neighborhood.mapLocation?.longitude) {
    data = {
      ...data,
      [`neighborhood.${updatedNeighborhood.type}.$.mapLocation.longitude`]: updatedNeighborhood
        .neighborhood.mapLocation.longitude,
    };
  }

  if (updatedNeighborhood.neighborhood.mapLocation?.latitude) {
    data = {
      ...data,
      [`neighborhood.${updatedNeighborhood.type}.$.mapLocation.latitude`]: updatedNeighborhood
        .neighborhood.mapLocation.latitude,
    };
  }

  try {
    return Property.findOneAndUpdate(
      { [`neighborhood.${updatedNeighborhood.type}._id`]: updatedNeighborhood.typeId },
      {
        $set: data,
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

export const addFloorPlan = async (floorPlanDetails) => {
  const property = await getPropertyById(floorPlanDetails.propertyId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!property) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid property');
  }

  if (floorPlanDetails.vendorId.toString() !== property.addedBy.toString()) {
    throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
  }

  try {
    return Property.findByIdAndUpdate(
      property._id,
      { $push: { floorPlans: { name: floorPlanDetails.name, plan: floorPlanDetails.plan } } },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error addding floor plan', error);
  }
};

export const updateFloorPlan = async (updatedFloorPlan) => {
  const property = await getPropertyById(updatedFloorPlan.propertyId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!property) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid property');
  }

  if (updatedFloorPlan.vendorId.toString() !== property.addedBy.toString()) {
    throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
  }

  try {
    return Property.findOneAndUpdate(
      { 'floorPlans._id': updatedFloorPlan.floorPlanId },
      {
        $set: {
          'floorPlans.$.name': updatedFloorPlan.name,
          'floorPlans.$.plan': updatedFloorPlan.plan,
        },
      },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error updating floor plan', error);
  }
};

export const deleteFloorPlan = async (floorPlanDetails) => {
  const property = await getPropertyById(floorPlanDetails.propertyId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!property) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid property');
  }

  if (floorPlanDetails.vendorId.toString() !== property.addedBy.toString()) {
    throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
  }

  try {
    return Property.findByIdAndUpdate(
      property._id,
      { $pull: { floorPlans: { _id: floorPlanDetails.floorPlanId } } },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error deleting floor plan', error);
  }
};

export const addGallery = async (imageDetails) => {
  const property = await getPropertyById(imageDetails.propertyId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!property) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid property');
  }

  if (imageDetails.vendorId.toString() !== property.addedBy.toString()) {
    throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
  }

  let { gallery } = property;

  gallery = gallery.filter((image) => image.title === imageDetails.title);

  if (gallery.length > 0) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Image with title already exists');
  }
  const newGallery = [{ title: imageDetails.title, url: imageDetails.url }, ...property.gallery];

  try {
    return Property.findByIdAndUpdate(
      property._id,
      { $set: { gallery: newGallery } },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error addding image', error);
  }
};

export const updateGallery = async (updatedImage) => {
  const property = await getPropertyById(updatedImage.propertyId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!property) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid property');
  }

  if (updatedImage.vendorId.toString() !== property.addedBy.toString()) {
    throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
  }

  const gallery = property.gallery.filter(
    (image) =>
      image.title === updatedImage.title &&
      image._id.toString() !== updatedImage.imageId.toString(),
  );

  if (gallery.length > 0) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Image with title already exists');
  }

  try {
    return Property.findOneAndUpdate(
      { 'gallery._id': updatedImage.imageId },
      {
        $set: {
          'gallery.$.title': updatedImage.title,
          'gallery.$.url': updatedImage.url,
        },
      },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error updating image', error);
  }
};

export const deleteGallery = async (imageDetails) => {
  const property = await getPropertyById(imageDetails.propertyId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!property) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid property');
  }

  if (imageDetails.vendorId.toString() !== property.addedBy.toString()) {
    throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
  }

  try {
    return Property.findByIdAndUpdate(
      property._id,
      { $pull: { gallery: { _id: imageDetails.imageId } } },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error deleting image', error);
  }
};

export const flagProperty = async (propertyInfo) => {
  const property = await getPropertyById(propertyInfo.propertyId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!property) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid property');
  }

  const vendor = await getUserById(property.addedBy).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (propertyInfo.reportId) {
    const report = await getReportById(propertyInfo.reportId);
    if (!report) {
      throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid report');
    }

    if (report.propertyId.toString() !== property._id.toString()) {
      throw new ErrorHandler(httpStatus.FORBIDDEN, 'Property does not match report property');
    }

    const reportInfo = {
      id: propertyInfo.reportId,
      resolvedBy: propertyInfo.adminId,
      notes: propertyInfo.notes || propertyInfo.reason,
    };

    await resolveReport(reportInfo).catch((error) => {
      throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
    });
  }

  try {
    const flaggedProperty = await Property.findByIdAndUpdate(
      property._id,
      {
        $set: { 'flagged.status': true },
        $push: {
          'flagged.case': {
            flaggedBy: propertyInfo.adminId,
            flaggedDate: Date.now(),
            flaggedReason: propertyInfo.reason,
          },
        },
      },
      { new: true },
    );

    const description = `Your property ${getFormattedName(property.name)} has been flagged`;
    await createNotification(NOTIFICATIONS.FLAG_PROPERTY, vendor._id, {
      actionId: property._id,
      description,
    });

    return { property: flaggedProperty, vendor };
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error flagging property', error);
  }
};

export const unflagProperty = async (propertyInfo) => {
  const property = await getPropertyById(propertyInfo.propertyId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!property) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid property');
  }

  const vendor = await getUserById(property.addedBy).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  try {
    await Property.findOneAndUpdate(
      { 'flagged.case._id': propertyInfo.caseId },
      {
        $set: {
          'flagged.case.$.unflaggedBy': propertyInfo.adminId,
          'flagged.case.$.unflaggedDate': Date.now(),
          'flagged.case.$.unflaggedReason': propertyInfo.reason,
        },
      },
    );

    const unflaggedProperty = await Property.findByIdAndUpdate(
      property._id,
      { $set: { 'flagged.status': false } },
      { new: true },
    );

    const description = `Your property ${getFormattedName(property.name)} has been unflagged`;
    await createNotification(NOTIFICATIONS.UNFLAG_PROPERTY, vendor._id, {
      actionId: property._id,
      description,
    });

    return { property: unflaggedProperty, vendor };
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error unflagging property', error);
  }
};

export const getOnePortfolio = async (offerId, user = {}) => {
  const total = await getTotalAmountPaidForProperty(offerId);
  const amountContributed = total.length > 0 ? total[0].totalAmountContributed : 0;

  const portfolioOptions = [
    { $match: { _id: ObjectId(offerId) } },
    {
      $lookup: {
        from: 'properties',
        localField: 'propertyId',
        foreignField: '_id',
        as: 'propertyInfo',
      },
    },
    {
      $lookup: {
        from: 'nextpayments',
        let: { oOfferId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$offerId', '$$oOfferId'] }, { $eq: ['$resolved', false] }],
              },
            },
          },
        ],
        as: 'nextPaymentInfo',
      },
    },
    { $unwind: '$propertyInfo' },
    {
      $project: {
        'propertyInfo.assignedTo': 0,
      },
    },
  ];

  const portfolio = await Offer.aggregate(portfolioOptions);

  if (
    portfolio.length < 1 ||
    (portfolio.length > 0 &&
      ((user?.role === USER_ROLE.VENDOR &&
        user?._id.toString() !== portfolio[0].vendorId.toString()) ||
        (user?.role === USER_ROLE.USER && user?._id.toString() !== portfolio[0].userId.toString())))
  ) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Portfolio not found');
  }

  return {
    ...portfolio[0],
    amountContributed,
  };
};

export const approveProperty = async ({ propertyId, adminId }) => {
  const property = await getPropertyById(propertyId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!property) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid property');
  }

  try {
    return Property.findByIdAndUpdate(
      property._id,
      {
        $set: {
          'approved.by': adminId,
          'approved.date': Date.now(),
          'approved.status': true,
        },
      },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error approving property', error);
  }
};
