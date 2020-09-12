import {
  getAllUserReferrals,
  updateReferralToRewarded,
  getReferralByEmail,
  sendReferralInvite,
} from '../services/referral.service';
import httpStatus from '../helpers/httpStatus';
import EMAIL_CONTENT from '../../mailer';
import { sendMail } from '../services/mailer.service';

const ReferralController = {
  getAllUserReferrals(req, res, next) {
    const referrerId = req.params.id;
    getAllUserReferrals(referrerId)
      .then((referrals) => {
        res.status(httpStatus.OK).json({ success: true, referrals });
      })
      .catch((error) => next(error));
  },

  getReferrals(req, res, next) {
    const { user } = req;
    getAllUserReferrals(user._id)
      .then((referrals) => {
        res.status(httpStatus.OK).json({ success: true, referrals });
      })
      .catch((error) => next(error));
  },

  updateReferralToRewarded(req, res, next) {
    const { referralId } = req.locals;
    updateReferralToRewarded(referralId)
      .then((referral) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Referral rewarded', referral });
      })
      .catch((error) => next(error));
  },

  getByEmail(req, res, next) {
    const { email } = req.locals;
    getReferralByEmail(email)
      .then((referral) => {
        res.status(httpStatus.OK).json({ success: true, referral });
      })
      .catch((error) => next(error));
  },

  sendInvite(req, res, next) {
    const { email } = req.locals;
    const referrerId = req.user._id;
    sendReferralInvite({ referrerId, email })
      .then((inviteInfo) => {
        const contentTop = `${inviteInfo.referrerName} just invited you to BALLERS.`;
        const contentBottom = `Use their code ${inviteInfo.referralCode}, or click the link below`;
        sendMail(
          EMAIL_CONTENT.REFERRAL_INVITE,
          { email: inviteInfo.email, firstName: ' ' },
          {
            contentTop,
            contentBottom,
            link: `http://ballers.ng/referral/invite/${inviteInfo.referralCode}`,
          },
        );
        res.status(httpStatus.OK).json({ success: true, message: 'Invite sent' });
      })
      .catch((error) => next(error));
  },
};

export default ReferralController;
