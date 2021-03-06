import express from 'express';
import MailerController from '../controllers/mailer.controllers';

const router = express.Router();

router.get('/templates', MailerController.getEmailTemplate);

module.exports = router;
