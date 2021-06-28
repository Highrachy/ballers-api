import {
  updateReferralToRewarded,
  sendReferralInvite,
  getUserByRefCode,
  getReferralById,
  getAllReferrals,
  updateReferralPercentage,
} from '../services/referral.service';
import httpStatus from '../helpers/httpStatus';
import EMAIL_CONTENT from '../../mailer';
import { sendMail } from '../services/mailer.service';
import { HOST } from '../config';

const ReferralController = {
  getAllReferrals(req, res, next) {
    const { user, query } = req;
    getAllReferrals(user, query)
      .then(({ result, pagination }) => {
        res.status(httpStatus.OK).json({ success: true, pagination, result });
      })
      .catch((error) => next(error));
  },

  updateReferralToRewarded(req, res, next) {
    const { referralId } = req.locals;
    const adminId = req.user._id;
    updateReferralToRewarded({ referralId, adminId })
      .then(({ referral, referrer }) => {
        const subject = `You have received a referral bonus of ${referral.reward.amount}`;
        const contentTop = `You have received a referral bonus of ${referral.reward.amount} as commission for your referral. Visit your dashboard for more information.`;
        sendMail(EMAIL_CONTENT.REWARD_REFERRAL, referrer, { contentTop, subject });

        res.status(httpStatus.OK).json({ success: true, message: 'Referral rewarded', referral });
      })
      .catch((error) => next(error));
  },

  sendInvite(req, res, next) {
    const invite = req.locals;
    const referrerId = req.user._id;
    sendReferralInvite({ ...invite, referrerId })
      .then((inviteInfo) => {
        const contentTop = `${inviteInfo.referrerName} just invited you to Become A LandLord on ballers.ng`;
        sendMail(
          EMAIL_CONTENT.REFERRAL_INVITE,
          { email: inviteInfo.email, firstName: invite.firstName || ' ' },
          {
            contentTop,
            link: `${HOST}/invite/${inviteInfo._id}`,
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
        if (user.length > 0) {
          res.status(httpStatus.OK).json({ success: true, user: user[0] });
        } else {
          res.status(httpStatus.NOT_FOUND).json({ success: false, message: 'User not found' });
        }
      })
      .catch((error) => next(error));
  },

  getReferralById(req, res, next) {
    const referralId = req.params.id;
    getReferralById(referralId)
      .then((referral) => {
        res.status(httpStatus.OK).json({ success: true, referral });
      })
      .catch((error) => next(error));
  },

  updateReferralPercentage(req, res, next) {
    const referralInfo = req.locals;
    updateReferralPercentage(referralInfo)
      .then((referral) => {
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Referral percentage updated', referral });
      })
      .catch((error) => next(error));
  },
};

export default ReferralController;
