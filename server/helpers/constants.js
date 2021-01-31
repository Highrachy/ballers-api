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
  NEGLECTED: 'Neglected',
  CANCELLED: 'Cancelled',
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
    default: null,
  },
  country: {
    type: String,
    default: null,
  },
  state: {
    type: String,
    default: null,
  },
  street1: {
    type: String,
    default: null,
  },
  street2: {
    type: String,
    default: null,
  },
};

export const COMMENT_STATUS = {
  RESOLVED: 'Resolved',
  PENDING: 'Pending',
};
