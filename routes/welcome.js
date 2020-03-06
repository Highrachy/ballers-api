import express from 'express';

const router = express.Router();

// get phone number belonging to a customer's email
router.get('/', (req, res) => {
  res.status(200).send({ success: true, message: 'Welcome to Ballers API endpoint' });
});

module.exports = router;
