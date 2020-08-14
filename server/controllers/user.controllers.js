import {
  addUser,
  loginUser,
  activateUser,
  forgotPasswordToken,
  resetPasswordViaToken,
  updateUser,
  assignPropertyToUser,
  getAllUserProperties,
  getAllRegisteredUsers,
  getUserInfo,
} from '../services/user.service';
import { sendMail } from '../services/mailer.service';
import EMAIL_CONTENT from '../../mailer';
import httpStatus from '../helpers/httpStatus';

const UserController = {
  register(req, res, next) {
    const user = req.locals;
    addUser(user)
      .then((token) => {
        sendMail(EMAIL_CONTENT.ACTIVATE_YOUR_ACCOUNT, user, {
          link: `http://ballers.ng/activate?token=${token}`,
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
          link: `http://ballers.ng/change-password/${data.token}`,
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
          link: `http://ballers.ng/reset-password`,
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
    getUserInfo(id)
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
    getAllRegisteredUsers()
      .then((users) => {
        res.status(httpStatus.OK).json({ success: true, users });
      })
      .catch((error) => next(error));
  },

  getOwnedProperties(req, res, next) {
    const { user } = req;
    getAllUserProperties(user._id)
      .then((properties) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Properties found', properties });
      })
      .catch((error) => next(error));
  },
};

export default UserController;
