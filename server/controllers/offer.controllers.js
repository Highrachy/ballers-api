import {
  createOffer,
  acceptOffer,
  assignOffer,
  cancelOffer,
  getOffer,
  getAllOffersUser,
  getAllOffersAdmin,
  getActiveOffers,
  raiseConcern,
  resolveConcern,
} from '../services/offer.service';
import httpStatus from '../helpers/httpStatus';
import EMAIL_CONTENT from '../../mailer';
import { sendMail } from '../services/mailer.service';

const OfferController = {
  create(req, res, next) {
    const newOffer = req.locals;
    const vendorId = req.user._id;
    createOffer({ ...newOffer, vendorId })
      .then((offer) => {
        const user = offer.userInfo;
        const contentTop = `Ballers just made you an offer for property "${
          offer.propertyInfo.name
        }". Valid till ${new Date(
          Date.parse(offer.expires),
        ).toUTCString()} Check your dashboard for more details.`;

        sendMail(EMAIL_CONTENT.OFFER_CREATED, user, { contentTop });

        res.status(httpStatus.CREATED).json({ success: true, message: 'Offer created', offer });
      })
      .catch((error) => next(error));
  },

  accept(req, res, next) {
    const offerInfo = req.locals;
    const userId = req.user._id;
    acceptOffer({ ...offerInfo, userId })
      .then((offer) => {
        const offerResponse = offer[0];
        const vendor = offerResponse.vendorInfo;
        const user = offerResponse.userInfo;
        const contentTop = `Your offer on ${offerResponse.propertyInfo.name} has been accepted. Check your dashboard for more details.`;

        sendMail(EMAIL_CONTENT.OFFER_RESPONSE_VENDOR, vendor, { contentTop });
        sendMail(EMAIL_CONTENT.OFFER_RESPONSE_USER, user, {});

        offerResponse.vendorId = null;
        offerResponse.vendorInfo = null;
        offerResponse.userInfo = null;

        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Offer accepted', offer: offerResponse });
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

  cancel(req, res, next) {
    const { offerId } = req.locals;
    const vendorId = req.user._id;
    cancelOffer({ offerId, vendorId })
      .then(() => {
        res.status(httpStatus.OK).json({ success: true, message: 'Offer cancelled' });
      })
      .catch((error) => next(error));
  },

  getOne(req, res, next) {
    const offerId = req.params.id;
    getOffer(offerId)
      .then((offer) => {
        if (offer.length > 0) {
          res.status(httpStatus.OK).json({ success: true, offer: offer[0] });
        } else {
          res.status(httpStatus.NOT_FOUND).json({ success: false, message: 'Offer not found' });
        }
      })
      .catch((error) => next(error));
  },

  getAllUserOffers(req, res, next) {
    const userId = req.user._id;
    getAllOffersUser(userId)
      .then((offers) => {
        res.status(httpStatus.OK).json({ success: true, offers });
      })
      .catch((error) => next(error));
  },

  getAllAdminOffers(req, res, next) {
    const adminId = req.user._id;
    getAllOffersAdmin(adminId)
      .then((offers) => {
        res.status(httpStatus.OK).json({ success: true, offers });
      })
      .catch((error) => next(error));
  },

  getAllUserOffersAdmin(req, res, next) {
    const userId = req.params.id;
    getAllOffersUser(userId)
      .then((offers) => {
        res.status(httpStatus.OK).json({ success: true, offers });
      })
      .catch((error) => next(error));
  },

  getAllActive(req, res, next) {
    const userId = req.user._id;
    getActiveOffers(userId)
      .then((offers) => {
        res.status(httpStatus.OK).json({ success: true, offers });
      })
      .catch((error) => next(error));
  },

  raiseConcern(req, res, next) {
    const concern = req.locals;
    const userId = req.user._id;
    raiseConcern({ ...concern, userId })
      .then((offer) => {
        const offerResponse = offer[0];
        const vendor = offerResponse.vendorInfo;
        const contentTop = `A concern has been raised on your offer to ${offerResponse.enquiryInfo.lastName}, ${offerResponse.enquiryInfo.firstName}. <br>The question states: <b style='color: #161d3f'>${concern.question}</b>.`;

        sendMail(EMAIL_CONTENT.RAISE_CONCERN, vendor, { contentTop });
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Concern raised', offer: offerResponse });
      })
      .catch((error) => next(error));
  },

  resolveConcern(req, res, next) {
    const concern = req.locals;
    const vendorId = req.user._id;
    resolveConcern({ ...concern, vendorId })
      .then((offer) => {
        const offerResponse = offer[0];
        const user = offerResponse.userInfo;

        sendMail(EMAIL_CONTENT.RESOLVE_CONCERN, user, {});
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Concern resolved', offer: offerResponse });
      })
      .catch((error) => next(error));
  },
};

export default OfferController;
