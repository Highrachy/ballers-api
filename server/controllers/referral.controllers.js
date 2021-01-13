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
import { HOST } from '../config';

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
        if (referral.length > 0) {
          res.status(httpStatus.OK).json({ success: true, referral: referral[0] });
        } else {
          res.status(httpStatus.NOT_FOUND).json({ success: false, message: 'Referral not found' });
        }
      })
      .catch((error) => next(error));
  },
};

export default ReferralController;
