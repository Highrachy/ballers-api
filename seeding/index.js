import { startDBConnection } from '../server/config';
import { logSuccess, logError } from './seed-helpers';
import { MODEL, ROLE } from './seed-constants';
import { seedUsers } from './user.seeding';
import resetDB from './reset.seeding';

const seedDB = async () => {
  const model = process.env.MODEL?.toUpperCase();
  const limit = process.env.LIMIT || 1;
  const role = process.env.ROLE || ROLE.USER;

  startDBConnection();

  try {
    switch (model) {
      case MODEL.USER:
        await seedUsers(limit, role);
        break;
      case MODEL.RESET:
        await resetDB();
        break;

      default:
        logError(`Invalid model input. Available models are: ${Object.values(MODEL)}`);
        break;
    }

    logSuccess('Done!');
  } catch (error) {
    logError(error);
  }
};

seedDB();
