const generatePagination = (page, limit, total) => ({
  currentPage: parseInt(page, 10),
  limit: parseInt(limit, 10),
  offset: (page - 1) * limit,
  total,
  totalPage: Math.ceil(total / limit),
});

export default generatePagination;
