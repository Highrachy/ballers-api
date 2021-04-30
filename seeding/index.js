import { startDBConnection } from '../server/config';
import logger from '../server/config/winston';
import { seedUsers, seedVendors } from './user.seeding';

const seedDB = async () => {
  const model = process.env.SEED;
  const limit = process.env.LIMIT;

  try {
    startDBConnection();

    if (model) {
      switch (model) {
        case 'user':
          seedUsers(limit);
          break;
        case 'vendor':
          seedVendors(limit);
          break;

        default:
          break;
      }
    } else {
      seedUsers(limit);
      seedVendors(limit);
    }
    logger.info('done');
  } catch (error) {
    logger.error(error);
  }
};

seedDB();
