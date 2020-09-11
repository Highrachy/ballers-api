import {
  getReferraslByRefereeId,
  updateReferralToRegistered,
  updateReferralToRewarded,
} from '../services/referal.service';
import httpStatus from '../helpers/httpStatus';

const ReferralController = {
  getReferraslByRefereeId(req, res, next) {
    const refereeId = req.params.id;
    getReferraslByRefereeId(refereeId)
      .then((referrals) => {
        res.status(httpStatus.OK).json({ success: true, referrals });
      })
      .catch((error) => next(error));
  },

  updateReferralToRegistered(req, res, next) {
    const { referralId } = req.locals;
    updateReferralToRegistered(referralId)
      .then((referral) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Referral registered', referral });
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
};

export default ReferralController;
