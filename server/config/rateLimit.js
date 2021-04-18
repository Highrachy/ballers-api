import rateLimit from 'express-rate-limit';

const timeFrameInHours = 24;
const maxNoOfRequests = 5000;

const rateLimiter = rateLimit({
  windowMs: timeFrameInHours * 60 * 60 * 1000,
  max: maxNoOfRequests,
  message: `You have exceeded the ${maxNoOfRequests} requests in ${timeFrameInHours}hrs limit!`,
  headers: true,
});

export default rateLimiter;
