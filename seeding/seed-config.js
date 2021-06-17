export const model = (process.env.MODEL || 'user').toUpperCase(); // reset, user
export const limit = process.env.LIMIT || 4;
export const role = process.env.ROLE || 'user'; // user, admin, vendor, editor
