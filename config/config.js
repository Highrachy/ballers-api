import dotenv from 'dotenv';

dotenv.config();

const DB_URL = process.env.DB_URL || 'mongodb://localhost:27017/ballers';
const PORT = process.env.PORT || 3000;
const USER_SECRET = process.env.USER_SECRET || 'local_secret';

export { DB_URL, PORT, USER_SECRET };
