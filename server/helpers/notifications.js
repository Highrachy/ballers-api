import { NOTIFICATION_TYPE } from './constants';

const NOTIFICATIONS = {
  ACTIVATE_YOUR_ACCOUNT: {
    description: 'Your account has been successfully created',
    type: NOTIFICATION_TYPE.INFO,
    url: '/',
  },
  BAN_USER: {
    description: 'Your account has been locked for security reasons.',
    type: NOTIFICATION_TYPE.DANGER,
    url: '/',
  },
  CANCEL_VISIT: {
    description: 'The visitation to [property] property has been cancelled',
    type: NOTIFICATION_TYPE.DANGER,
    url: '/',
  },
  CERTIFY_VENDOR: {
    description: 'Your account has been certified',
    type: NOTIFICATION_TYPE.SUCCESS,
    url: '/',
  },
  CHANGED_PASSWORD: {
    description: 'Password changed sucessfully',
    type: NOTIFICATION_TYPE.INFO,
    url: '/',
  },
  ENQUIRY_ADDED: {
    description: 'You have received a new enquiry',
    type: NOTIFICATION_TYPE.INFO,
    url: '/',
  },
  FLAG_PROPERTY: {
    description: 'Your property has been flagged',
    type: NOTIFICATION_TYPE.DANGER,
    url: '/',
  },
  OFFER_CREATED: {
    description: 'You have received an offer',
    type: NOTIFICATION_TYPE.INFO,
    url: '/',
  },
  OFFER_REACTIVATED: {
    description: 'Your offer has been reactivated',
    type: NOTIFICATION_TYPE.INFO,
    url: '/',
  },
  OFFER_RESPONSE_VENDOR: {
    description: 'Your offer has been accepted',
    type: NOTIFICATION_TYPE.SUCCESS,
    url: '/',
  },
  OFFER_RESPONSE_USER: {
    description: 'Congratulations on signing your offer',
    type: NOTIFICATION_TYPE.SUCCESS,
    url: '/',
  },
  OFFLINE_PAYMENT_ADDED: {
    description: 'Your offline payment has been added successfully',
    type: NOTIFICATION_TYPE.INFO,
    url: '/',
  },
  OFFLINE_PAYMENT_RESOLVED: {
    description: 'Your offline payment has been confirmed',
    type: NOTIFICATION_TYPE.SUCCESS,
    url: '/',
  },
  PAYMENT_REMINDER: {
    description: 'You have a pending payment due',
    type: NOTIFICATION_TYPE.INFO,
    url: '/',
  },
  RAISE_CONCERN: {
    description: 'A comment has been raised on your offer',
    type: NOTIFICATION_TYPE.INFO,
    url: '/',
  },
  RAISE_COMMENT_FOR_OFFLINE_PAYMENT: {
    description: 'A comment has been raised on your offline payment',
    type: NOTIFICATION_TYPE.INFO,
    url: '/',
  },
  REMITTANCE_PAID: {
    description: 'You have received payment on one of your properties',
    type: NOTIFICATION_TYPE.INFO,
    url: '/',
  },
  RESCHEDULE_VISIT: {
    description: 'Your visitation has been rescheduled',
    type: NOTIFICATION_TYPE.INFO,
    url: '/',
  },
  RESOLVE_CONCERN: {
    description: 'Your raised concern has been resolved.',
    type: NOTIFICATION_TYPE.INFO,
    url: '/',
  },
  RESOLVE_COMMENT_FOR_OFFLINE_PAYMENT: {
    description: 'Your raised comment has been resolved.',
    type: NOTIFICATION_TYPE.INFO,
    url: '/',
  },
  SCHEDULE_VISIT_USER: {
    description: 'Your visitation has been requested successfully',
    type: NOTIFICATION_TYPE.INFO,
    url: '/',
  },
  SCHEDULE_VISIT_VENDOR: {
    description: 'A new propery visit has been requested',
    type: NOTIFICATION_TYPE.INFO,
    url: '/',
  },
  UNBAN_USER: {
    description: 'Your account has been unlocked',
    type: NOTIFICATION_TYPE.INFO,
    url: '/',
  },
  UNFLAG_PROPERTY: {
    description: 'Your property has been unflagged',
    type: NOTIFICATION_TYPE.INFO,
    url: '/',
  },
  VERIFY_VENDOR: {
    description: 'Your account has been verified',
    type: NOTIFICATION_TYPE.SUCCESS,
    url: '/',
  },
  WELCOME_MESSAGE: {
    description: `Congratulations you're officially a BALLer.`,
    type: NOTIFICATION_TYPE.INFO,
    url: '/',
  },
};

export default NOTIFICATIONS;
