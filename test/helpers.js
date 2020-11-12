import { expect } from './config';

const expectsPaginationToReturnTheRightValues = (
  res,
  { result, currentPage, limit, offset, total, totalPage },
) => {
  expect(res).to.have.status(200);
  expect(res.body.success).to.be.eql(true);
  expect(res.body.result.length).to.be.eql(result);
  expect(res.body.pagination.currentPage).to.be.eql(currentPage);
  expect(res.body.pagination.limit).to.be.eql(limit);
  expect(res.body.pagination.offset).to.be.eql(offset);
  expect(res.body.pagination.total).to.be.eql(total);
  expect(res.body.pagination.totalPage).to.be.eql(totalPage);
};

export default expectsPaginationToReturnTheRightValues;
