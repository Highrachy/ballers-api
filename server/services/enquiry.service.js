import mongoose from 'mongoose';
import Enquiry from '../models/enquiry.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
// eslint-disable-next-line import/no-cycle
import { getPropertyById } from './property.service';
import { USER_ROLE } from '../helpers/constants';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';
import { NON_PROJECTED_USER_INFO } from '../helpers/projectedSchemaInfo';
import { buildFilterQuery, ENQUIRY_FILTERS } from '../helpers/filters';

const { ObjectId } = mongoose.Types.ObjectId;

export const getEnquiryById = async (id) => Enquiry.findById(id).select();

export const addEnquiry = async (enquiry) => {
  const property = await getPropertyById(enquiry.propertyId);
  if (!property) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Invalid property');
  }

  const existingEnquiry = await Enquiry.find({
    propertyId: enquiry.propertyId,
    userId: enquiry.userId,
  });

  if (existingEnquiry.length > 0) {
    throw new ErrorHandler(
      httpStatus.PRECONDITION_FAILED,
      'You can only make one enquiry for this property',
    );
  }
  try {
    const newEnquiry = await new Enquiry({ ...enquiry, vendorId: property.addedBy }).save();
    return newEnquiry;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding enquiry', error);
  }
};

export const approveEnquiry = async ({ enquiryId, vendor }) => {
  const enquiry = await getEnquiryById(enquiryId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  try {
    if (vendor.role === USER_ROLE.VENDOR && vendor._id.toString() !== enquiry.vendorId.toString()) {
      throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
    }

    return Enquiry.findOneAndUpdate(
      { _id: enquiry.id },
      { $set: { approved: true, approvedBy: vendor._id, approvalDate: Date.now() } },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error approving enquiry', error);
  }
};

export const getAllEnquiries = async (user, { page = 1, limit = 10, ...query } = {}) => {
  const filterQuery = buildFilterQuery(ENQUIRY_FILTERS, query);

  const enquiryOptions = [
    { $match: { $and: filterQuery } },
    {
      $lookup: {
        from: 'properties',
        localField: 'propertyId',
        foreignField: '_id',
        as: 'propertyInfo',
      },
    },
    {
      $unwind: '$propertyInfo',
    },
    {
      $lookup: {
        from: 'users',
        localField: 'propertyInfo.addedBy',
        foreignField: '_id',
        as: 'vendorInfo',
      },
    },
    {
      $unwind: '$vendorInfo',
    },
    {
      $project: NON_PROJECTED_USER_INFO('vendorInfo'),
    },
    {
      $facet: {
        metadata: [{ $count: 'total' }, { $addFields: { page, limit } }],
        data: generateFacetData(page, limit),
      },
    },
  ];

  if (filterQuery.length < 1) {
    enquiryOptions.shift();
  }
  if (user.role === USER_ROLE.VENDOR) {
    enquiryOptions.unshift({ $match: { vendorId: ObjectId(user._id) } });
  }
  if (user.role === USER_ROLE.USER) {
    enquiryOptions.unshift({ $match: { userId: ObjectId(user._id) } });
  }

  const enquiries = await Enquiry.aggregate(enquiryOptions);

  const total = getPaginationTotal(enquiries);
  const pagination = generatePagination(page, limit, total);
  const result = enquiries[0].data;
  return { pagination, result };
};

export const getEnquiry = async ({ enquiryId, user }) => {
  const enquiryOptions = [
    { $match: { _id: ObjectId(enquiryId) } },
    {
      $lookup: {
        from: 'properties',
        localField: 'propertyId',
        foreignField: '_id',
        as: 'propertyInfo',
      },
    },
    {
      $unwind: '$propertyInfo',
    },
    {
      $lookup: {
        from: 'users',
        localField: 'propertyInfo.addedBy',
        foreignField: '_id',
        as: 'vendorInfo',
      },
    },
    {
      $unwind: '$vendorInfo',
    },
    {
      $project: NON_PROJECTED_USER_INFO('vendorInfo'),
    },
  ];

  if (user.role === USER_ROLE.VENDOR) {
    enquiryOptions.unshift({ $match: { vendorId: ObjectId(user._id) } });
  }
  if (user.role === USER_ROLE.USER) {
    enquiryOptions.unshift({ $match: { userId: ObjectId(user._id) } });
  }

  const enquiries = await Enquiry.aggregate(enquiryOptions);

  return enquiries;
};
