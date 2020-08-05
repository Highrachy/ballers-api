import Enquiry from '../models/enquiry.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';

export const getEnquiryById = async (id) => Enquiry.findById(id).select();

export const addEnquiry = async (enquiry) => {
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
  if (!enquiry) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Enquiry not found');
  }
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

export const getAllEnquiries = async () => Enquiry.find();
