import { addEnquiry, approveEnquiry, getAllEnquiries } from '../services/enquiry.service';
import httpStatus from '../helpers/httpStatus';

const EnquiryController = {
  add(req, res, next) {
    const newEnquiry = req.locals;
    const { user } = req;
    addEnquiry({ ...newEnquiry, userId: user._id })
      .then((enquiry) => {
        res.status(httpStatus.CREATED).json({ success: true, message: 'Enquiry added', enquiry });
      })
      .catch((error) => next(error));
  },

  approve(req, res, next) {
    const approvedEnquiry = req.locals;
    const { user } = req;
    approveEnquiry({ ...approvedEnquiry, adminId: user._id })
      .then((enquiry) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Enquiry approved', enquiry });
      })
      .catch((error) => next(error));
  },

  getAll(req, res, next) {
    getAllEnquiries()
      .then((enquiries) => {
        res.status(httpStatus.OK).json({ success: true, enquiries });
      })
      .catch((error) => next(error));
  },
};

export default EnquiryController;
