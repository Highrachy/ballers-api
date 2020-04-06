import { addUser, loginUser } from '../services/user.service';

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
    const user = req.locals;
    loginUser(user)
      .then((token) => {
        res.status(200).json({ success: true, message: 'Login successful', token });
      })
      .catch((error) => next(error));
  },
};

export default UserController;
