import { clearDB } from '../server/config';
import { logLoading, logError, logInfo } from './seed-helpers';
import { addDefaultUsers } from './user.seeding';

const resetDB = async () => {
  await clearDB();
  logInfo('Clearing database');

  await addDefaultUsers()
    .then(logLoading('DB reset complete'))
    .catch((error) => {
      logError(error);
    });
};

export default resetDB;
