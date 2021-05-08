import { NOTIFICATION_TYPE, NOTIFICATION_ACTION } from './constants';

const NOTIFICATIONS = {
  ACCOUNT_ACTIVATED: {
    description: 'Your account has been activated successfully',
    type: NOTIFICATION_TYPE.SUCCESS,
    action: NOTIFICATION_ACTION.USER,
    actionId: null,
  },
  BAN_USER: {
    description: 'Your account has been locked for security reasons.',
    type: NOTIFICATION_TYPE.DANGER,
    action: NOTIFICATION_ACTION.USER,
    actionId: null,
  },
  CANCEL_VISIT: {
    description: 'Your visitation to [property] for [date] has been cancelled',
    type: NOTIFICATION_TYPE.DANGER,
    action: NOTIFICATION_ACTION.VISITATION,
    actionId: null,
  },
  CERTIFY_VENDOR: {
    description: 'Your account has been certified',
    type: NOTIFICATION_TYPE.SUCCESS,
    action: NOTIFICATION_ACTION.USER,
    actionId: null,
  },
  CHANGED_PASSWORD: {
    description: 'Password changed sucessfully',
    type: NOTIFICATION_TYPE.INFO,
    action: NOTIFICATION_ACTION.USER,
    actionId: null,
  },
  ENQUIRY_ADDED: {
    description: 'You have received a new enquiry for [property]',
    type: NOTIFICATION_TYPE.INFO,
    action: NOTIFICATION_ACTION.ENQUIRY,
    actionId: null,
  },
  FIRST_LAST_PAYMENT: {
    description: 'Hooray, you have made your [first/last] payment for [property]',
    type: NOTIFICATION_TYPE.SUCCESS,
    action: NOTIFICATION_ACTION.TRANSACTION,
    actionId: null,
  },
  FLAG_PROPERTY: {
    description: 'Your property has been flagged',
    type: NOTIFICATION_TYPE.DANGER,
    action: NOTIFICATION_ACTION.PROPERTY,
    actionId: null,
  },
  OFFER_CREATED: {
    description: 'You have received an offer',
    type: NOTIFICATION_TYPE.INFO,
    action: NOTIFICATION_ACTION.OFFER,
    actionId: null,
  },
  OFFER_REACTIVATED: {
    description: 'Your offer has been reactivated',
    type: NOTIFICATION_TYPE.INFO,
    action: NOTIFICATION_ACTION.OFFER,
    actionId: null,
  },
  OFFER_RESPONSE_VENDOR: {
    description: 'Your offer has been accepted',
    type: NOTIFICATION_TYPE.SUCCESS,
    action: NOTIFICATION_ACTION.OFFER,
    actionId: null,
  },
  OFFER_RESPONSE_USER: {
    description: 'Congratulations on signing your offer',
    type: NOTIFICATION_TYPE.SUCCESS,
    action: NOTIFICATION_ACTION.OFFER,
    actionId: null,
  },
  OFFLINE_PAYMENT_ADDED: {
    description: 'You added an offline payment of N[amount] for [property]',
    type: NOTIFICATION_TYPE.INFO,
    action: NOTIFICATION_ACTION.OFFLINE_PAYMENT,
    actionId: null,
  },
  OFFLINE_PAYMENT_RESOLVED: {
    description: 'Your payment of N[amount] for [property] has been confirmed',
    type: NOTIFICATION_TYPE.SUCCESS,
    action: NOTIFICATION_ACTION.OFFLINE_PAYMENT,
    actionId: null,
  },
  PAYMENT_REMINDER: {
    description: 'You have a pending payment due',
    type: NOTIFICATION_TYPE.INFO,
    action: NOTIFICATION_ACTION.TRANSACTION,
    actionId: null,
  },
  RAISE_CONCERN: {
    description: 'A comment has been raised on your offer',
    type: NOTIFICATION_TYPE.INFO,
    action: NOTIFICATION_ACTION.OFFER,
    actionId: null,
  },
  RAISE_COMMENT_FOR_OFFLINE_PAYMENT: {
    description: 'A comment has been raised on your offline payment',
    type: NOTIFICATION_TYPE.INFO,
    action: NOTIFICATION_ACTION.OFFLINE_PAYMENT,
    actionId: null,
  },
  REMITTANCE_PAID: {
    description: 'You have received N[amount] for your property [property]',
    type: NOTIFICATION_TYPE.INFO,
    action: NOTIFICATION_ACTION.TRANSACTION,
    actionId: null,
  },
  RESCHEDULE_VISIT: {
    description: 'Your visitation to [property] for [old date] has been rescheduled to [new date]',
    type: NOTIFICATION_TYPE.INFO,
    action: NOTIFICATION_ACTION.VISITATION,
    actionId: null,
  },
  RESOLVE_CONCERN: {
    description: 'Your raised concern has been resolved.',
    type: NOTIFICATION_TYPE.INFO,
    action: NOTIFICATION_ACTION.OFFER,
    actionId: null,
  },
  RESOLVE_COMMENT_FOR_OFFLINE_PAYMENT: {
    description: 'Your raised comment has been resolved.',
    type: NOTIFICATION_TYPE.INFO,
    action: NOTIFICATION_ACTION.OFFLINE_PAYMENT,
    actionId: null,
  },
  SCHEDULE_VISIT_USER: {
    description: 'Your visitation to [property] has been scheduled for [date]',
    type: NOTIFICATION_TYPE.INFO,
    action: NOTIFICATION_ACTION.VISITATION,
    actionId: null,
  },
  SCHEDULE_VISIT_VENDOR: {
    description: 'Your propery [property], has been scheduled for a visit on [date]',
    type: NOTIFICATION_TYPE.INFO,
    action: NOTIFICATION_ACTION.VISITATION,
    actionId: null,
  },
  UNBAN_USER: {
    description: 'Your account has been unlocked',
    type: NOTIFICATION_TYPE.INFO,
    action: NOTIFICATION_ACTION.USER,
    actionId: null,
  },
  UNFLAG_PROPERTY: {
    description: 'Your property has been unflagged',
    type: NOTIFICATION_TYPE.INFO,
    action: NOTIFICATION_ACTION.PROPERTY,
    actionId: null,
  },
  VERIFY_VENDOR: {
    description: 'Your account has been verified',
    type: NOTIFICATION_TYPE.SUCCESS,
    action: NOTIFICATION_ACTION.USER,
    actionId: null,
  },
  WELCOME_MESSAGE: {
    description: `Congratulations you're officially a BALLer.`,
    type: NOTIFICATION_TYPE.SUCCESS,
    action: NOTIFICATION_ACTION.USER,
    actionId: null,
  },
};

export default NOTIFICATIONS;
