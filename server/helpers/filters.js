export const FILTER_TYPE = {
  BOOLEAN: 'boolean',
  INTEGER: 'integer',
  STRING: 'string',
};

export const buildFilterQuery = (filterKeys, query, type, prefix = '') => {
  const pre = prefix.length > 0 ? `${prefix}.` : '';

  return filterKeys.reduce((acc, key) => {
    if (query[key]) {
      switch (type) {
        case FILTER_TYPE.BOOLEAN:
          acc.push({ [`${pre}${key}`]: query[key] === 'true' });
          break;

        case FILTER_TYPE.INTEGER:
          acc.push({ [`${pre}${key}`]: parseInt(query[key], 10) });
          break;

        case FILTER_TYPE.STRING:
          acc.push({ [`${pre}${key}`]: { $regex: query[key], $options: 'i' } });
          break;

        default:
          break;
      }
    }
    return acc;
  }, []);
};
