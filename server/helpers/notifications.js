import { NOTIFICATION_TYPE, NOTIFICATION_ACTION } from './constants';

const NOTIFICATIONS = {
  ACCOUNT_ACTIVATED: {
    action: NOTIFICATION_ACTION.USER,
    description: 'Your account has been activated successfully',
    type: NOTIFICATION_TYPE.SUCCESS,
  },
  APPROVE_PROPERTY: {
    action: NOTIFICATION_ACTION.PROPERTY,
    description: 'Your property [property name] has been approved and is now available for viewing',
    type: NOTIFICATION_TYPE.INFO,
  },
  BAN_USER: {
    action: NOTIFICATION_ACTION.USER,
    description: 'Your account has been locked for security reasons',
    type: NOTIFICATION_TYPE.DANGER,
  },
  CANCEL_VISIT: {
    action: NOTIFICATION_ACTION.VISITATION,
    description: 'Your visitation to [property] for [date] has been cancelled',
    type: NOTIFICATION_TYPE.DANGER,
  },
  CERTIFY_VENDOR: {
    action: NOTIFICATION_ACTION.USER,
    description: 'Your account has been certified',
    type: NOTIFICATION_TYPE.SUCCESS,
  },
  CHANGED_PASSWORD: {
    action: NOTIFICATION_ACTION.USER,
    description: 'Password changed sucessfully',
    type: NOTIFICATION_TYPE.INFO,
  },
  ENQUIRY_ADDED: {
    action: NOTIFICATION_ACTION.ENQUIRY,
    description: 'You have received a new enquiry for [property]',
    type: NOTIFICATION_TYPE.INFO,
  },
  FIRST_LAST_PAYMENT: {
    action: NOTIFICATION_ACTION.TRANSACTION,
    description: 'Hooray, you have made your [first/last] payment for [property]',
    type: NOTIFICATION_TYPE.SUCCESS,
  },
  FLAG_PROPERTY: {
    action: NOTIFICATION_ACTION.PROPERTY,
    description: 'Your property [property] has been flagged',
    type: NOTIFICATION_TYPE.DANGER,
  },
  OFFER_CREATED: {
    action: NOTIFICATION_ACTION.OFFER,
    description: 'You have received an offer for [property]',
    type: NOTIFICATION_TYPE.INFO,
  },
  OFFER_REACTIVATED: {
    action: NOTIFICATION_ACTION.OFFER,
    description: 'Your offer for [property] has been reactivated',
    type: NOTIFICATION_TYPE.INFO,
  },
  OFFER_RESPONSE_VENDOR: {
    action: NOTIFICATION_ACTION.OFFER,
    description: 'Your offer for [property] has been accepted',
    type: NOTIFICATION_TYPE.SUCCESS,
  },
  OFFER_RESPONSE_USER: {
    action: NOTIFICATION_ACTION.OFFER,
    description: 'Congratulations on signing your offer for [property]',
    type: NOTIFICATION_TYPE.SUCCESS,
  },
  OFFLINE_PAYMENT_ADDED: {
    action: NOTIFICATION_ACTION.OFFLINE_PAYMENT,
    description: 'You added an offline payment of N[amount] for [property]',
    type: NOTIFICATION_TYPE.INFO,
  },
  OFFLINE_PAYMENT_RESOLVED: {
    action: NOTIFICATION_ACTION.OFFLINE_PAYMENT,
    description: 'Your payment of N[amount] for [property] has been confirmed',
    type: NOTIFICATION_TYPE.SUCCESS,
  },
  PAYMENT_REMINDER: {
    action: NOTIFICATION_ACTION.OFFER,
    description: 'You have a pending payment due',
    type: NOTIFICATION_TYPE.INFO,
  },
  RAISE_CONCERN: {
    action: NOTIFICATION_ACTION.OFFER,
    description: 'A comment has been raised on your offer for [property]',
    type: NOTIFICATION_TYPE.INFO,
  },
  RAISE_COMMENT_FOR_OFFLINE_PAYMENT: {
    action: NOTIFICATION_ACTION.OFFLINE_PAYMENT,
    description: 'A comment has been raised on your offline payment for [property]',
    type: NOTIFICATION_TYPE.INFO,
  },
  REMITTANCE_PAID: {
    action: NOTIFICATION_ACTION.TRANSACTION,
    description: 'You have received N[amount] for your property [property]',
    type: NOTIFICATION_TYPE.INFO,
  },
  RESCHEDULE_VISIT: {
    action: NOTIFICATION_ACTION.VISITATION,
    description: 'Your visitation to [property] for [old date] has been rescheduled to [new date]',
    type: NOTIFICATION_TYPE.INFO,
  },
  RESOLVE_CONCERN: {
    action: NOTIFICATION_ACTION.OFFER,
    description: 'Your raised concern has been resolved.',
    type: NOTIFICATION_TYPE.INFO,
  },
  RESOLVE_COMMENT_FOR_OFFLINE_PAYMENT: {
    action: NOTIFICATION_ACTION.OFFLINE_PAYMENT,
    description: 'Your raised comment has been resolved.',
    type: NOTIFICATION_TYPE.INFO,
  },
  REQUEST_BANK_DETAILS: {
    action: NOTIFICATION_ACTION.USER,
    description:
      'Your bank details have been requested. Kindly update it in your account settings.',
    type: NOTIFICATION_TYPE.INFO,
  },
  REQUEST_UNFLAG: {
    action: NOTIFICATION_ACTION.PROPERTY,
    description: 'You have received a request to unflag a property you recently flagged',
    type: NOTIFICATION_TYPE.INFO,
  },
  REWARD_REFERRAL: {
    action: NOTIFICATION_ACTION.REFERRAL,
    description: 'You have received a referral bonus of [amount] as commission for your referral',
    type: NOTIFICATION_TYPE.SUCCESS,
  },
  SCHEDULE_VISIT_USER: {
    action: NOTIFICATION_ACTION.VISITATION,
    description: 'Your visitation to [property] has been scheduled for [date]',
    type: NOTIFICATION_TYPE.INFO,
  },
  SCHEDULE_VISIT_VENDOR: {
    action: NOTIFICATION_ACTION.VISITATION,
    description: 'Your propery [property], has been scheduled for a visit on [date]',
    type: NOTIFICATION_TYPE.INFO,
  },
  UNBAN_USER: {
    action: NOTIFICATION_ACTION.USER,
    description: 'Your account has been unlocked',
    type: NOTIFICATION_TYPE.INFO,
  },
  UNFLAG_PROPERTY: {
    action: NOTIFICATION_ACTION.PROPERTY,
    description: 'Your property [property] has been unflagged',
    type: NOTIFICATION_TYPE.INFO,
  },
  VERIFY_VENDOR: {
    action: NOTIFICATION_ACTION.USER,
    description: 'Your account has been verified',
    type: NOTIFICATION_TYPE.SUCCESS,
  },
  WELCOME_MESSAGE: {
    action: NOTIFICATION_ACTION.USER,
    description: `Congratulations you're officially a BALLer.`,
    type: NOTIFICATION_TYPE.SUCCESS,
  },
};

export default NOTIFICATIONS;
