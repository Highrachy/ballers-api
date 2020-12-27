import mongoose from 'mongoose';
import Enquiry from '../models/enquiry.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
// eslint-disable-next-line import/no-cycle
import { getPropertyById } from './property.service';

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
    const newEnquiry = await new Enquiry(enquiry).save();
    return newEnquiry;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding enquiry', error);
  }
};

export const approveEnquiry = async (approvedEnquiry) => {
  const enquiry = await getEnquiryById(approvedEnquiry.enquiryId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  try {
    return Enquiry.findOneAndUpdate(
      { _id: enquiry.id },
      { $set: { approved: true, approvedBy: approvedEnquiry.adminId, approvalDate: Date.now() } },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error approving enquiry', error);
  }
};

export const getAllEnquiries = async () =>
  Enquiry.aggregate([
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
        localField: 'approvedBy',
        foreignField: '_id',
        as: 'approvedBy',
      },
    },
    {
      $project: {
        'propertyInfo.assignedTo': 0,
        'approvedBy.assignedProperties': 0,
        'approvedBy.password': 0,
        'approvedBy.referralCode': 0,
      },
    },
  ]);

export const getEnquiry = async (enquiryId) =>
  Enquiry.aggregate([
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
      $lookup: {
        from: 'users',
        localField: 'approvedBy',
        foreignField: '_id',
        as: 'approvedBy',
      },
    },
    {
      $project: {
        'propertyInfo.assignedTo': 0,
        'approvedBy.assignedProperties': 0,
        'approvedBy.password': 0,
        'approvedBy.referralCode': 0,
      },
    },
  ]);
