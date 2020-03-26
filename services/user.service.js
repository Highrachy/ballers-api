import User from '../models/user.model';

export const getByEmail = async (email) => User.findOne({ email });
export const getById = async (id) => User.findById(id);
export const addUser = async (newUser) => newUser.save();
