import dotenv from 'dotenv';

dotenv.config();

const DB_URL = 'mongodb://localhost:27017/ballers' || process.env.DB_URL;
const PORT = process.env.PORT || 3000;

export { DB_URL, PORT };
