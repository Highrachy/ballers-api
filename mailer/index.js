const EMAIL_CONTENT = {
  ACTIVATE_YOUR_ACCOUNT: {
    buttonText: 'Verify Email',
    contentTop:
      'Your Ballers.ng account has been successfully created. To complete your registration, you need to confirm that we got your email address right.',
    subject: 'Verify your Email',
  },
  CHANGE_PASSWORD: {
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
  RESET_PASSWORD_LINK: {
    buttonText: 'Reset Password',
    contentBottom: "If you didn't request a password reset, let us know as soon as possible",
    contentTop:
      "You (or someone pretending to be you) requested a password reset for your account. If you didn't made this request you can ignore this email.",
    subject: 'Password Reset',
  },
  SCHEDULE_VISIT: {
    subject: 'Property Visit Requested',
    contentTop: 'A new propery visit has been requested',
  },
  REFERRAL_INVITE: {
    subject: 'BALLERS Invite',
    contentTop: '[Referrer Name] just invited you to BALLERS.',
    contentBottom: `Use their code [Referral code], or click the link below`,
    buttonText: 'Join BALLERS',
  },
  OFFER_CREATED: {
    subject: 'New Offer Available',
    contentTop:
      'Ballers just made you an offer for property [Property name]. Valid till [Expiry date]. Check your dashboard for more details.',
  },
  OFFER_RESPONSE_VENDOR: {
    subject: 'Offer Accepted',
    contentTop:
      'Your offer on [Property name] has been accepted. Check your dashboard for more details.',
  },
  OFFER_RESPONSE_USER: {
    subject: 'Offer Signed',
    contentTop: `Congratulations on signing your offer. Details of your next steps are included in your offer letter and we are here to guide your process.`,
    contentBottom: `Meanwhile, click below to read our article on <a href="https://ballers.ng">5 Things Every Intending Homeowner Should Know</a>. We look forward to an enjoyable process.`,
  },
  WELCOME_MESSAGE: {
    subject: 'Welcome to BALLers',
    contentTop: `Congratulations you're officially a BALLer.`,
  },
  RAISE_CONCERN: {
    subject: 'Concern Raised',
    contentTop: `A concern has been raised on your offer to [User name]. The question states [question].`,
    contentBottom: `Check your dashboard to resolve this concern.`,
  },
  RESOLVE_CONCERN: {
    subject: 'Concern Resolved',
    contentTop: `Your raised concern has been resolved. Details below <br /> <strong>Question: </strong> [Question]<br /> <strong>Response: </strong>[Response]`,
  },
};

module.exports = EMAIL_CONTENT;
