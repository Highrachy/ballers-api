import { startDBConnection, closeDBConnection } from '../server/config';
import { logSuccess, logError } from './seed-helpers';
import { MODEL } from './seed-constants';
import { seedUsers } from './user.seeding';
import resetDB from './reset.seeding';
import { model, limit, role } from './seed-config';

const NODE_ENV = process.env.NODE_ENV || 'development';

const seedDB = async () => {
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

  closeDBConnection();
};

if (NODE_ENV === 'development') {
  seedDB();
} else {
  logError('Seeding is only available in `development environment`');
}
