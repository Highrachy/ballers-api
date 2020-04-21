import EMAIL_CONTENT from '../../mailer';
import { generateEmailTemplate } from '../services/mailer.service';

const SAMPLE_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOm51bGwsInR5cGUiOjIsImlhdCI6MTU3OTQzMDYzMH0.Wc-0c9uGNgf2fIKDR_58ZFHHtEftWB1Tso8ym5YTSQY';

const MailerController = {
  async getEmailTemplate(req, res) {
    const name = req.query.name || 'DEFAULT';
    if (!EMAIL_CONTENT[name]) {
      return res.status(404).json({ message: 'Email Template not found' });
    }
    const emailType = req.query.type === 'text' ? 'text' : 'html';
    const options = {
      ...EMAIL_CONTENT[name],
      link: `http://ballers.ng/${SAMPLE_TOKEN}`,
    };
    const data = await generateEmailTemplate(options);
    return res.send(data[emailType]);
  },
};

export default MailerController;
