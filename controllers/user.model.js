import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  createdAt: {
    type: String,
    required: true,
  },
  updatedAt: {
    type: String,
    required: true,
  },

});

const User = mongoose.model('User', UserSchema);

User.getUserByEmail = (email, callback) => {
  const query = { email };
  User.findOne(query, callback);
};

User.getUserByPhone = (phone, callback) => {
  const query = { phone };
  User.findOne(query, callback);
};

User.addUser = (newUser, callback) => {
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newUser.password, salt, (error, hash) => {
      if (error) throw error;
      newUser.password = hash;
      newUser.save(callback);
    });
  });
};

export default User;
