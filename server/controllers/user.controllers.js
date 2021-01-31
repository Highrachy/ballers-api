import {
  addUser,
  loginUser,
  activateUser,
  forgotPasswordToken,
  resetPasswordViaToken,
  updateUser,
  assignPropertyToUser,
  getAllUsers,
  getUserInfo,
  addPropertyToFavorites,
  removePropertyFromFavorites,
  getAccountOverview,
  upgradeUserToEditor,
  downgradeEditorToUser,
  verifyVendorStep,
  updateVendor,
  addCommentToVerificationStep,
  verifyVendor,
  editDirector,
  removeDirector,
  getOneUser,
  certifyVendor,
  resolveVerificationStepComment,
  banUser,
  unbanUser,
} from '../services/user.service';
import { sendMail } from '../services/mailer.service';
import EMAIL_CONTENT from '../../mailer';
import httpStatus from '../helpers/httpStatus';
import { HOST } from '../config';

const UserController = {
  register(req, res, next) {
    const user = req.locals;
    addUser(user)
      .then((token) => {
        sendMail(EMAIL_CONTENT.ACTIVATE_YOUR_ACCOUNT, user, {
          link: `${HOST}/activate?token=${token}`,
        });
        res
          .status(httpStatus.CREATED)
          .json({ success: true, message: 'Registration successful', token });
      })
      .catch((error) => next(error));
  },

  login(req, res, next) {
    const loginDetails = req.locals;
    loginUser(loginDetails)
      .then((user) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Login successful', user });
      })
      .catch((error) => next(error));
  },

  activateToken(req, res, next) {
    const { token } = req.query;
    activateUser(token)
      .then((user) => {
        sendMail(EMAIL_CONTENT.WELCOME_MESSAGE, user, {});
        res.status(httpStatus.OK).json({
          success: true,
          message: 'Your account has been successfully activated',
          user: { ...user.toJSON(), token },
        });
      })
      .catch((error) => next(error));
  },

  generateResetPasswordLink(req, res, next) {
    const { email } = req.locals;
    forgotPasswordToken(email)
      .then((data) => {
        sendMail(EMAIL_CONTENT.RESET_PASSWORD_LINK, data.user, {
          link: `${HOST}/change-password/${data.token}`,
        });
        res.status(httpStatus.OK).json({
          success: true,
          message: 'A password reset link has been sent to your email account',
        });
      })
      .catch((error) => next(error));
  },

  resetPasswordFromLink(req, res, next) {
    const { token } = req.params;
    const { password } = req.locals;
    resetPasswordViaToken(password, token)
      .then((user) => {
        sendMail(EMAIL_CONTENT.CHANGED_PASSWORD, user, {
          link: `${HOST}/reset-password`,
        });
        res.status(httpStatus.OK).json({
          success: true,
          message: 'Your password has been successfully changed',
          user,
        });
      })
      .catch((error) => next(error));
  },

  currentUser(req, res, next) {
    const id = req.user._id;
    getUserInfo('_id', id)
      .then((user) => {
        res.status(httpStatus.OK).json({
          success: true,
          message: 'Your information has been successfully retrieved',
          user,
        });
      })
      .catch((error) => next(error));
  },

  assignProperty(req, res, next) {
    const toBeAssigned = req.locals;
    const { user } = req;
    assignPropertyToUser({ ...toBeAssigned, assignedBy: user._id, vendor: user })
      .then(() => {
        res.status(httpStatus.OK).json({ success: true, message: 'Property assigned' });
      })
      .catch((error) => next(error));
  },

  update(req, res, next) {
    const updatedUser = req.locals;
    updateUser({ ...req.user, ...updatedUser, id: req.user._id })
      .then((user) => {
        res.status(httpStatus.OK).json({ success: true, message: 'User updated', user });
      })
      .catch((error) => next(error));
  },

  getAllUsers(req, res, next) {
    const {
      page,
      limit,
      role,
      activated,
      firstName,
      lastName,
      email,
      phone,
      referralCode,
      verified,
      certified,
      companyName,
    } = req.query;
    getAllUsers({
      page,
      limit,
      role,
      activated,
      firstName,
      lastName,
      email,
      phone,
      referralCode,
      verified,
      certified,
      companyName,
    })
      .then(({ pagination, result }) => {
        res.status(httpStatus.OK).json({
          success: true,
          pagination,
          result,
        });
      })
      .catch((error) => next(error));
  },

  addPropertyToFavorites(req, res, next) {
    const property = req.locals;
    const { user } = req;
    addPropertyToFavorites({ ...property, userId: user._id })
      .then(() => {
        res.status(httpStatus.OK).json({ success: true, message: 'Property added to favorites' });
      })
      .catch((error) => next(error));
  },

  removePropertyFromFavorites(req, res, next) {
    const property = req.locals;
    const { user } = req;
    removePropertyFromFavorites({ ...property, userId: user._id })
      .then(() => {
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Property removed from favorites' });
      })
      .catch((error) => next(error));
  },

  getAccountOverview(req, res, next) {
    const userId = req.user._id;
    getAccountOverview(userId)
      .then((accountOverview) => {
        res.status(httpStatus.OK).json({
          success: true,
          accountOverview,
        });
      })
      .catch((error) => next(error));
  },

  upgradeUserToEditor(req, res, next) {
    const { userId } = req.locals;
    upgradeUserToEditor(userId)
      .then((user) => {
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'User is now a Content Editor', user });
      })
      .catch((error) => next(error));
  },

  downgradeEditorToUser(req, res, next) {
    const { userId } = req.locals;
    downgradeEditorToUser(userId)
      .then((user) => {
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Content Editor is now a User', user });
      })
      .catch((error) => next(error));
  },

  verifyVendorStep(req, res, next) {
    const verificationInfo = req.locals;
    const adminId = req.user._id;
    verifyVendorStep({ ...verificationInfo, adminId })
      .then((vendor) => {
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Vendor information verified', vendor });
      })
      .catch((error) => next(error));
  },

  addCommentToVerificationStep(req, res, next) {
    const commentInfo = req.locals;
    const adminId = req.user._id;
    addCommentToVerificationStep({ ...commentInfo, adminId })
      .then((vendor) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Comment added', vendor });
      })
      .catch((error) => next(error));
  },

  verifyVendor(req, res, next) {
    const { vendorId } = req.locals;
    const adminId = req.user._id;
    verifyVendor({ vendorId, adminId })
      .then((vendor) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Vendor verified', vendor });
      })
      .catch((error) => next(error));
  },

  updateVendor(req, res, next) {
    const updatedVendor = req.locals;
    const { user } = req;
    updateVendor({ updatedVendor, user })
      .then((updatedUser) => {
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Vendor information updated', user: updatedUser });
      })
      .catch((error) => next(error));
  },

  editDirector(req, res, next) {
    const directorInfo = req.locals;
    const { user } = req;
    editDirector({ directorInfo, user })
      .then((updatedUser) => {
        res.status(httpStatus.OK).json({
          success: true,
          message: 'Director information was successfully updated',
          user: updatedUser,
        });
      })
      .catch((error) => next(error));
  },

  removeDirector(req, res, next) {
    const directorId = req.params.id;
    const { user } = req;
    removeDirector({ directorId, user })
      .then((updatedUser) => {
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Director removed', user: updatedUser });
      })
      .catch((error) => next(error));
  },

  getOneUser(req, res, next) {
    const userId = req.params.id;
    getOneUser(userId)
      .then((user) => {
        if (user.length > 0) {
          res.status(httpStatus.OK).json({ success: true, user: user[0] });
        } else {
          res.status(httpStatus.NOT_FOUND).json({ success: false, message: 'User not found' });
        }
      })
      .catch((error) => next(error));
  },

  certifyVendor(req, res, next) {
    const { vendorId } = req.locals;
    const adminId = req.user._id;
    certifyVendor({ vendorId, adminId })
      .then((vendor) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Vendor certified', vendor });
      })
      .catch((error) => next(error));
  },

  resolveVerificationStepComment(req, res, next) {
    const commentInfo = req.locals;
    resolveVerificationStepComment(commentInfo)
      .then((vendor) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Comment resolved', vendor });
      })
      .catch((error) => next(error));
  },

  banUser(req, res, next) {
    const banInfo = req.locals;
    const adminId = req.user._id;
    banUser({ ...banInfo, adminId })
      .then((user) => {
        sendMail(EMAIL_CONTENT.BAN_USER, user, {});
        res.status(httpStatus.OK).json({ success: true, message: 'User banned', user });
      })
      .catch((error) => next(error));
  },

  unbanUser(req, res, next) {
    const unbanInfo = req.locals;
    const adminId = req.user._id;
    unbanUser({ ...unbanInfo, adminId })
      .then((user) => {
        sendMail(EMAIL_CONTENT.UNBAN_USER, user, {});
        res.status(httpStatus.OK).json({ success: true, message: 'User unbanned', user });
      })
      .catch((error) => next(error));
  },
};

export default UserController;
