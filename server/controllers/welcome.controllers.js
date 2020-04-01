export default {
  welcome(req, res) {
    res.status(200).send({ success: true, message: 'Welcome to Ballers API endpoint' });
  },
};
