import {
  createOffer,
  acceptOffer,
  assignOffer,
  getOffer,
  getAllOffers,
} from '../services/offerLetter.service';
import httpStatus from '../helpers/httpStatus';
import EMAIL_CONTENT from '../../mailer';
import { sendMail } from '../services/mailer.service';

const OfferLetterController = {
  create(req, res, next) {
    const newOffer = req.locals;
    const { user } = req;
    createOffer({ ...newOffer, vendorId: user._id })
      .then((offer) => {
        res.status(httpStatus.CREATED).json({ success: true, message: 'Offer created', offer });
      })
      .catch((error) => next(error));
  },

  accept(req, res, next) {
    const offerResponse = req.locals;
    acceptOffer(offerResponse)
      .then((offer) => {
        const vendor = offer[0].vendorInfo;
        const contentBottom = `Dear ${vendor.firstName}, your offer on ${offer[0].propertyInfo.name} has been accepted. Check your dashboard for more details.`;
        sendMail(EMAIL_CONTENT.OFFER_RESPONSE, { email: vendor.email }, { contentBottom });
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Offer accepted', offer: offer[0] });
      })
      .catch((error) => next(error));
  },

  assign(req, res, next) {
    const { offerId } = req.locals;
    assignOffer(offerId)
      .then((offer) => {
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Offer assigned', offer: offer[0] });
      })
      .catch((error) => next(error));
  },

  getOne(req, res, next) {
    const offerId = req.params.id;
    getOffer(offerId)
      .then((offer) => {
        res.status(httpStatus.OK).json({ success: true, offer: offer[0] });
      })
      .catch((error) => next(error));
  },

  getAll(req, res, next) {
    const userId = req.user._id;
    getAllOffers(userId)
      .then((offers) => {
        res.status(httpStatus.OK).json({ success: true, offers });
      })
      .catch((error) => next(error));
  },
};

export default OfferLetterController;
