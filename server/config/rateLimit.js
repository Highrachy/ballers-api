import rateLimit from 'express-rate-limit';

const timeFrameInHours = 1;
const maxNoOfRequests = 500;

const rateLimiter = rateLimit({
  windowMs: timeFrameInHours * 60 * 60 * 1000,
  max: maxNoOfRequests,
  message: `You have exceeded the ${maxNoOfRequests} requests in ${timeFrameInHours} hour limit!`,
  headers: true,
});

export default rateLimiter;
