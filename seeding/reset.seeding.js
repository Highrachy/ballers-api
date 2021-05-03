import { clearDB } from '../server/config';
import { logLoading, logError, logInfo } from './seed-helpers';
import { ROLE } from './seed-constants';
import seedUsers from './user.seeding';

const resetDB = async () => {
  clearDB();

  await new Promise((resolve) => {
    logInfo('Clearing database');
    return setTimeout(resolve, 5000);
  });

  try {
    await Promise.all(
      Object.values(ROLE).map(async (role) => {
        await seedUsers(1, role, { email: `${role}1@highrachy.com` });
      }),
    );

    logLoading('DB reset complete');
  } catch (error) {
    logError(error);
  }
};

export default resetDB;
