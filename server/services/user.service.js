import User from '../models/user.model';

export const getUserByEmail = async (email) => User.findOne({ email });
export const getUserById = async (id) => User.findById(id);
export const addUser = async (newUser) => newUser.save();
