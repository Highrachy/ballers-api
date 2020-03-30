import express from 'express';
import { registerSchema } from '../schemas/user.schema';
import { schemaValidation } from '../helpers/middleware';
import UserController from '../controllers/user.controllers';

const router = express.Router();

router.post('/register', schemaValidation(registerSchema), UserController.register);

module.exports = router;
