export const USER_ROLE = {
  ADMIN: 0,
  USER: 1,
  VENDOR: 2,
  EDITOR: 3,
};

export const OFFER_STATUS = {
  GENERATED: 'Generated',
  INTERESTED: 'Interested',
  ASSIGNED: 'Assigned',
  ALLOCATED: 'Allocated',
  REJECTED: 'Rejected',
  REACTIVATED: 'Reactivated',
  CANCELLED: 'Cancelled',
  RESOLVED: 'Resolved',
};

export const REFERRAL_STATUS = {
  SENT: 'Sent',
  REGISTERED: 'Registered',
  REWARDED: 'Rewarded',
};

export const REWARD_STATUS = {
  PENDING: 'Pending',
  PROGRESS: 'Progress',
  PAID: 'Paid',
};

export const CONCERN_STATUS = {
  RESOLVED: 'Resolved',
  PENDING: 'Pending',
};

export const VENDOR_INFO_STATUS = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  IN_REVIEW: 'In Review',
};

export const VENDOR_STEPS = ['companyInfo', 'bankDetails', 'directorInfo', 'documentUpload'];

export const addressSchema = {
  city: {
    type: String,
  },
  country: {
    type: String,
  },
  state: {
    type: String,
  },
  street1: {
    type: String,
  },
  street2: {
    type: String,
  },
};

export const COMMENT_STATUS = {
  RESOLVED: 'Resolved',
  PENDING: 'Pending',
};

export const VISITATION_STATUS = {
  CANCELLED: 'Cancelled',
  PENDING: 'Pending',
  RESOLVED: 'Resolved',
};

export const PROCESS_VISITATION_ACTION = {
  CANCEL: 0,
  RESCHEDULE: 1,
};

export const NEIGHBORHOOD_STEPS = [
  'entertainments',
  'hospitals',
  'pointsOfInterest',
  'restaurantsAndBars',
  'schools',
  'shoppingMalls',
];

export const NOTIFICATION_TYPE = {
  DANGER: 0,
  CONTENT: 1,
  INFO: 2,
  SUCCESS: 3,
};

export const NOTIFICATION_ACTION = {
  ENQUIRY: 'ENQUIRY',
  OFFLINE_PAYMENT: 'OFFLINE_PAYMENT',
  OFFER: 'OFFER',
  PROPERTY: 'PROPERTY',
  TRANSACTION: 'PAYMENT',
  USER: 'USER',
  VISITATION: 'VISITATION',
};

export const VALID_PORTFOLIO_OFFER = [
  { status: OFFER_STATUS.ASSIGNED },
  { status: OFFER_STATUS.ALLOCATED },
  { status: OFFER_STATUS.INTERESTED },
  { status: OFFER_STATUS.RESOLVED },
];

export const ACTIVE_PORTFOLIO_OFFER = [
  { status: OFFER_STATUS.GENERATED },
  { status: OFFER_STATUS.INTERESTED },
  { status: OFFER_STATUS.ASSIGNED },
  { status: OFFER_STATUS.ALLOCATED },
];

export const REFERRAL_RATE = 1.5;
