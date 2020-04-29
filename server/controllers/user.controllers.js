import { addUser, loginUser, loginViaSocialMedia } from '../services/user.service';
import '../services/passport.service';

const UserController = {
  register(req, res, next) {
    const user = req.locals;
    addUser(user)
      .then((token) => {
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

  socialMediaLogin(req, res, next) {
    const { user } = req;
    loginViaSocialMedia(user)
      .then((payload) => {
        res
          .status(200)
          .json({ success: true, message: 'Authentication Successful', user: payload });
      })
      .catch((error) => next(error));
  },
};

export default UserController;
