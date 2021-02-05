import { parse, add } from 'date-fns';

export const FILTER_TYPE = {
  BOOLEAN: 'boolean',
  DATE: 'date',
  INTEGER: 'integer',
  STRING: 'string',
};

export const buildFilterQuery = (filterKeys, query, type, prefix = '') => {
  return filterKeys.reduce((acc, key) => {
    const matchKey = prefix.length > 0 ? `${prefix}.${key}` : key;
    if (query[key]) {
      switch (type) {
        case FILTER_TYPE.BOOLEAN:
          acc.push({ [matchKey]: query[key] === 'true' });
          break;

        case FILTER_TYPE.DATE:
          acc.push({
            [matchKey]: {
              $gte: parse(query[key], 'yyyy-MM-dd', new Date()),
              $lt: add(new Date(query[key]), { days: 1 }),
            },
          });
          break;

        case FILTER_TYPE.INTEGER:
          acc.push({ [matchKey]: parseInt(query[key], 10) });
          break;

        case FILTER_TYPE.STRING:
          acc.push({ [matchKey]: { $regex: query[key], $options: 'i' } });
          break;

        default:
          break;
      }
    }
    return acc;
  }, []);
};
