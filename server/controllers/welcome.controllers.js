import httpStatus from '../helpers/httpStatus';

export default {
  welcome(req, res) {
    res.status(httpStatus.OK).send({ success: true, message: 'Welcome to Ballers API endpoint' });
  },
};
