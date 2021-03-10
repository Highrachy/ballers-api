import { reportProperty, resolveReport, getAllReports } from '../services/reportedProperty.service';
import httpStatus from '../helpers/httpStatus';

const ReportedPropertyController = {
  report(req, res, next) {
    const reportInfo = req.locals;
    const reportedBy = req.user._id;
    reportProperty({ ...reportInfo, reportedBy })
      .then((report) => {
        res
          .status(httpStatus.CREATED)
          .json({ success: true, message: 'Property reported successfully', report });
      })
      .catch((error) => next(error));
  },

  resolve(req, res, next) {
    const resolveInfo = req.locals;
    const resolvedBy = req.user._id;
    resolveReport({ ...resolveInfo, resolvedBy })
      .then((report) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Report resolved', report });
      })
      .catch((error) => next(error));
  },

  getAll(req, res, next) {
    getAllReports(req.query)
      .then(({ pagination, result }) => {
        res.status(httpStatus.OK).json({
          success: true,
          pagination,
          result,
        });
      })
      .catch((error) => next(error));
  },
};

export default ReportedPropertyController;
