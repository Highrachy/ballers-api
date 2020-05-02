import {
  addUser,
  loginUser,
  activateUser,
  forgotPasswordToken,
  resetPasswordViaToken,
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
        res.status(200).json({ success: true, message: 'Login successful', user });
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

  currentUser(req, res) {
    const { user } = req;

    return res
      .status(httpStatus.OK)
      .json({ success: true, message: 'Your information has been successfully retrieved', user });
  },
};

export default UserController;