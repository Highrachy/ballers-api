import ReportedProperty from '../models/reportedProperty.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
// eslint-disable-next-line import/no-cycle
import { getPropertyById } from './property.service';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';
import { buildFilterAndSortQuery, REPORT_FILTERS } from '../helpers/filters';
import { NON_PROJECTED_USER_INFO } from '../helpers/projectedSchemaInfo';

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
        localField: 'reportedBy',
        foreignField: '_id',
        as: 'reportedBy',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'resolved.by',
        foreignField: '_id',
        as: 'resolved.by',
      },
    },
    {
      $unwind: '$propertyInfo',
    },
    {
      $unwind: '$reportedBy',
    },
    {
      $unwind: {
        path: '$resolved.by',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        ...NON_PROJECTED_USER_INFO('reportedBy'),
        ...NON_PROJECTED_USER_INFO('resolved.by'),
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
