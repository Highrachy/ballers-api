import ReportedProperty from '../models/reportedProperty.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { getPropertyById } from './property.service';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';
import { buildFilterAndSortQuery, REPORT_FILTERS } from '../helpers/filters';

export const getReportById = async (id) => ReportedProperty.findById(id).select();

export const reportProperty = async (report) => {
  const property = await getPropertyById(report.propertyId);
  if (!property) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Invalid property');
  }

  try {
    const reportedProperty = await new ReportedProperty(report).save();
    return reportedProperty;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error reporting property', error);
  }
};

export const resolveReport = async (resolveDetails) => {
  const report = await getReportById(resolveDetails.id);
  if (!report) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Invalid report');
  }

  try {
    return ReportedProperty.findByIdAndUpdate(
      report._id,
      {
        $set: {
          'resolved.by': resolveDetails.resolvedBy,
          'resolved.date': Date.now(),
          'resolved.notes': resolveDetails.notes,
          'resolved.status': true,
        },
      },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error resolving report', error);
  }
};

export const getAllReports = async ({ page = 1, limit = 10, ...query } = {}) => {
  const { filterQuery, sortQuery } = buildFilterAndSortQuery(REPORT_FILTERS, query);

  const reportOptions = [
    { $match: { $and: filterQuery } },
    { $sort: sortQuery },
    {
      $facet: {
        metadata: [{ $count: 'total' }, { $addFields: { page, limit } }],
        data: generateFacetData(page, limit),
      },
    },
    { $project: { preferences: 0, password: 0, notifications: 0 } },
  ];

  if (Object.keys(sortQuery).length === 0) {
    reportOptions.splice(1, 1);
  }

  if (filterQuery.length < 1) {
    reportOptions.shift();
  }

  const reports = await ReportedProperty.aggregate(reportOptions);
  const total = getPaginationTotal(reports);
  const pagination = generatePagination(page, limit, total);
  const result = reports[0].data;
  return { pagination, result };
};
