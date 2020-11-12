import {
  addUser,
  loginUser,
  activateUser,
  forgotPasswordToken,
  resetPasswordViaToken,
  updateUser,
  assignPropertyToUser,
  getAllRegisteredUsers,
  getUserInfo,
  addPropertyToFavorites,
  removePropertyFromFavorites,
  getAccountOverview,
  upgradeUserToEditor,
  downgradeEditorToUser,
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
        res.status(httpStatus.CREATED).json({ success: true, message: 'User registered', token });
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
        sendMail(EMAIL_CONTENT.CHANGE_PASSWORD, user, {
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
    assignPropertyToUser({ ...toBeAssigned, assignedBy: user._id })
      .then(() => {
        res.status(httpStatus.OK).json({ success: true, message: 'Property assigned' });
      })
      .catch((error) => next(error));
  },

  update(req, res, next) {
    const updatedUser = req.locals;
    const userId = req.user._id;
    updateUser({ ...updatedUser, id: userId })
      .then((user) => {
        res.status(httpStatus.OK).json({ success: true, message: 'User updated', user });
      })
      .catch((error) => next(error));
  },

  getAllRegisteredUsers(req, res, next) {
    const { page, limit } = req.query;
    getAllRegisteredUsers(page, limit)
      .then((response) => {
        res.status(httpStatus.OK).json({
          success: true,
          pagination: response.pagination,
          result: response.result,
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
};

export default UserController;
