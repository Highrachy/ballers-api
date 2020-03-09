import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).send({ success: true, message: 'Welcome to Ballers API endpoint' });
});

module.exports = router;
