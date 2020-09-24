import {
  getAllUserReferrals,
  updateReferralToRewarded,
  sendReferralInvite,
  getUserByRefCode,
  getReferralById,
  getAllReferrals,
} from '../services/referral.service';
import httpStatus from '../helpers/httpStatus';
import EMAIL_CONTENT from '../../mailer';
import { sendMail } from '../services/mailer.service';

const ReferralController = {
  getAllReferrals(req, res, next) {
    getAllReferrals()
      .then((referrals) => {
        res.status(httpStatus.OK).json({ success: true, referrals });
      })
      .catch((error) => next(error));
  },

  getUserReferrals(req, res, next) {
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

  sendInvite(req, res, next) {
    const invite = req.locals;
    const referrerId = req.user._id;
    sendReferralInvite({ ...invite, referrerId })
      .then((inviteInfo) => {
        const contentTop = `${inviteInfo.referrerName} just invited you to BALLERS.`;
        const contentBottom = `Use their code ${inviteInfo.referralCode}, or click the link below`;
        sendMail(
          EMAIL_CONTENT.REFERRAL_INVITE,
          { email: inviteInfo.email, firstName: invite.firstName || ' ' },
          {
            contentTop,
            contentBottom,
            link: `http://ballers.ng/invite/${inviteInfo._id}`,
          },
        );
        res.status(httpStatus.OK).json({ success: true, message: 'Invite sent' });
      })
      .catch((error) => next(error));
  },

  getUserByRefCode(req, res, next) {
    const refCode = req.params.refcode;
    getUserByRefCode(refCode)
      .then((user) => {
        res.status(httpStatus.OK).json({ success: true, user: user[0] });
      })
      .catch((error) => next(error));
  },

  getReferralById(req, res, next) {
    const referralId = req.params.id;
    getReferralById(referralId)
      .then((referral) => {
        res.status(httpStatus.OK).json({ success: true, referral: referral[0] });
      })
      .catch((error) => next(error));
  },
};

export default ReferralController;
