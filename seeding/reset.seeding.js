import { clearDB } from '../server/config';
import { logLoading, logError, logInfo } from './seed-helpers';
import { addDefaultUsers } from './user.seeding';

const resetDB = async () => {
  clearDB();

  await new Promise((resolve) => {
    logInfo('Clearing database');
    return setTimeout(resolve, 5000);
  });

  try {
    await addDefaultUsers();

    logLoading('DB reset complete');
  } catch (error) {
    logError(error);
  }
};

export default resetDB;
