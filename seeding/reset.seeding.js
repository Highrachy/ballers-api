import { clearDB } from '../server/config';
// eslint-disable-next-line import/no-cycle
import { logLoading, logError } from './index';

const resetDB = () => {
  try {
    clearDB();
    logLoading('DB reset complete');
  } catch (error) {
    logError(error);
  }
};

export default resetDB;
