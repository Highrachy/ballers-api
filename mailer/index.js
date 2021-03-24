const EMAIL_CONTENT = {
  ACTIVATE_YOUR_ACCOUNT: {
    buttonText: 'Verify Email',
    contentTop:
      'Your ballers.ng account has been successfully created. Complete your registration by clicking on the link below to verify your email',
    subject: 'Verify your Email',
  },
  BAN_USER: {
    subject: 'Account Locked',
    contentTop:
      'Your account has been locked for security reasons. Kindly contact Ballers Support for more information.',
  },
  CANCEL_VISIT: {
    subject: 'Visitation Cancelled',
    contentTop:
      'The visitation to [property name] on [previous visitation date], has been cancelled by [user]. [Reason]. Visit your dashboard for more information.',
  },
  CERTIFY_VENDOR: {
    subject: 'Account Certified',
    contentTop:
      'Congratulaions, you are now a ceritified vendor on BALLers. Visit your dashboard for more information.',
  },
  CHANGED_PASSWORD: {
    buttonText: 'Reset Password',
    contentBottom:
      "If you didn't change your password, your account might have been compromised and we recommend that you reset your password as soon as possible.",
    contentTop: 'This email confirms that your password has been changed.',
    subject: 'Your password has been changed!',
  },
  DEFAULT: {
    buttonText: 'Button Text',
    contentBottom: 'Bottom content is here',
    contentTop: 'This is the default top content',
    firstName: '[First Name]',
    greeting: 'Welcome',
    link: 'sample link',
    subject: 'Email Subject is Here',
  },
  FLAG_PROPERTY: {
    subject: 'Property Flagged',
    contentTop:
      'Your property [property name] has been flagged, and is now unavailable for viewing. Kindly visit your dashboard to resolve the issue.',
  },
  OFFER_CREATED: {
    subject: 'New Offer Available',
    contentTop:
      'You have received an offer via ballers.ng for a [Property type] in [Property name]. This offer is Valid till [expiry date]. Check your dashboard for more details.',
  },
  OFFER_RESPONSE_VENDOR: {
    subject: 'Offer Accepted',
    contentTop:
      'Note that your offer to [Buyers name] on [Property name] has been accepted. Check your dashboard for more details.',
  },
  OFFER_RESPONSE_USER: {
    subject: 'Offer Signed',
    contentTop: `Congratulations on signing your offer. Details of your next steps are included in your offer letter and we are here to guide your process.`,
    contentBottom: `Meanwhile, click below to read our article on <a href="https://ballers.ng">5 Things Every Intending Homeowner Should Know</a>. We look forward to an enjoyable process.`,
  },
  PAYMENT_REMINDER: {
    subject: 'Payment Reminder',
    contentTop:
      'This is a quick reminder that the periodic payment of your property [Property name], is due on [Payment date].',
    contentBottom:
      'Kindly contact us if you have any questions concerning the payment or proposed payment methods.',
  },
  RAISE_CONCERN: {
    subject: 'Concern Raised',
    contentTop: `A concern has been raised on your offer to [User name]. The question states [question].`,
    contentBottom: `Check your dashboard to resolve this concern.`,
  },
  REFERRAL_INVITE: {
    subject: 'BALLERS Invite',
    contentTop: '[Referrer Name] just invited you to Become A LandLord on ballers.ng',
    contentBottom: `Click on the link below to accept their invitation`,
    buttonText: 'Join BALLERS',
  },
  RESCHEDULE_VISIT: {
    subject: 'Visitation Rescheduled',
    contentTop:
      'The visitation to [property name] on [previous visitation date], has been rescheduled for [new date] by [user that rescheduled]. [Reason]. Visit your dashboard for more information.',
  },
  RESOLVE_CONCERN: {
    subject: 'Concern Resolved',
    contentTop: `Your raised concern has been resolved. Details below <br /> <strong>Question: </strong> [Question]<br /> <strong>Response: </strong>[Response]`,
  },
  RESET_PASSWORD_LINK: {
    buttonText: 'Reset Password',
    contentBottom:
      'If you did not request this password change, please ignore the reset button. However, your account might have been compromised and we recommend that you reset your password as soon as possible',
    contentTop:
      "You (or someone pretending to be you) requested a password reset for your account. If you didn't made this request you can ignore this email.",
    subject: 'Password Reset',
  },
  SCHEDULE_VISIT: {
    subject: 'You have a new inspection request',
    contentTop: 'A new propery visit has been requested',
  },
  UNBAN_USER: {
    subject: 'Account Unlocked',
    contentTop:
      'Your account has been unlocked, and the issue resolved. Your dashboard is now accessible.',
  },
  UNFLAG_PROPERTY: {
    subject: 'Property Unflagged',
    contentTop:
      'Your property [property name] has been unflagged, and is now available for viewing.',
  },
  VERIFY_VENDOR: {
    subject: 'Account Verified',
    contentTop:
      'Congratulaions, your information has been reviewed and your account verified. Your dashboard is now fully accessible.',
  },
  WELCOME_MESSAGE: {
    subject: 'Welcome to BALLERS',
    contentTop: `Congratulations you're officially a BALLer.`,
  },
};

module.exports = EMAIL_CONTENT;
