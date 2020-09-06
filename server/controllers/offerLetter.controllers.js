import {
  createOffer,
  acceptOffer,
  assignOffer,
  getOffer,
  getAllOffers,
} from '../services/offerLetter.service';
import httpStatus from '../helpers/httpStatus';

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
        res.status(httpStatus.OK).json({ success: true, message: 'Offer accepted', offer });
      })
      .catch((error) => next(error));
  },

  assign(req, res, next) {
    const assignmentDetails = req.locals;
    assignOffer(assignmentDetails)
      .then((offer) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Offer assigned', offer });
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
