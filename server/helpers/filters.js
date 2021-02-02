export const filterStringKeys = (filterQuery, stringArray, query, prefix = '') => {
  let pre = '';
  if (prefix.length > 0) {
    pre = `${prefix}.`;
  }

  stringArray.forEach((key) => {
    if (query[key]) {
      filterQuery.push({ [`${pre}${key}`]: { $regex: query[key], $options: 'i' } });
    }
  });
};

export const filterIntegerKeys = (filterQuery, integerArray, query, prefix = '') => {
  let pre = '';
  if (prefix.length > 0) {
    pre = `${prefix}.`;
  }

  integerArray.forEach((key) => {
    if (query[key]) {
      filterQuery.push({ [`${pre}${key}`]: parseInt(query[key], 10) });
    }
  });
};

export const filterBooleanKeys = (filterQuery, booleanArray, query, prefix = '') => {
  let pre = '';
  if (prefix.length > 0) {
    pre = `${prefix}.`;
  }

  booleanArray.forEach((key) => {
    if (query[key]) {
      filterQuery.push({ [`${pre}${key}`]: query[key] === 'true' });
    }
  });
};
