export const generatePagination = (page, limit, total) => {
  const currentPage = parseInt(page, 10) < 1 ? 1 : parseInt(page, 10);
  return {
    currentPage,
    limit: parseInt(limit, 10),
    offset: (currentPage - 1) * limit,
    total,
    totalPage: Math.ceil(total / limit),
  };
};

export const generateFacetData = (page, limit) => [
  { $skip: parseInt((page - 1) * limit, 10) },
  { $limit: parseInt(limit, 10) },
];
