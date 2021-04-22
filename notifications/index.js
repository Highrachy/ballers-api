import { NOTIFICATION_TYPE } from '../server/helpers/constants';

const NOTIFICATIONS = {
  WELCOME_MESSAGE: {
    description: `Congratulations you're officially a BALLer.`,
    type: NOTIFICATION_TYPE.INFO,
    url: '/',
  },
};

export default NOTIFICATIONS;
