import { addUser, loginUser, activateUser } from '../services/user.service';
import { sendMail } from '../services/mailer.service';
import EMAIL_CONTENT from '../../mailer';

const UserController = {
  register(req, res, next) {
    const user = req.locals;
    addUser(user)
      .then((token) => {
        sendMail(EMAIL_CONTENT.ACTIVATE_YOUR_ACCOUNT, user, {
          link: `http://ballers.ng/activate?token=${token}`,
        });
        res.status(201).json({ success: true, message: 'User registered', token });
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
        res.status(200).json({
          success: true,
          message: 'Your account has been successfully activated',
          user: { ...user.toJSON(), token },
        });
      })
      .catch((error) => next(error));
  },
};

export default UserController;
