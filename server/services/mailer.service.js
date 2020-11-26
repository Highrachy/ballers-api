import nodemailer from 'nodemailer';
import appRoot from 'app-root-path';
import ejs from 'ejs';
import sgMail from '@sendgrid/mail';
import textEmailTemplate from '../../mailer/mailer.text.template';

const MAILER_HTML_TEMPLATE = `${appRoot}/mailer/mailer.html.template.ejs`;
const BALLERS_NO_REPLY_EMAIL = 'no-reply@ballers.ng';

export const generateEmailTemplate = async (options) => {
  const html = await ejs.renderFile(MAILER_HTML_TEMPLATE, { ...options, async: true });
  const text = textEmailTemplate(options);
  return { html, text };
};

export const MailSender = {
  async mailTrap(email, options) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.mailtrap.io',
      port: 2525,
      secure: false,
      auth: {
        user: process.env.MAIL_TRAP_USER,
        pass: process.env.MAIL_TRAP_PASSWORD,
      },
    });

    const { html, text } = await generateEmailTemplate(options);

    await transporter.sendMail({
      to: `${email}`,
      from: BALLERS_NO_REPLY_EMAIL,
      subject: `${options.subject}`,
      text,
      html,
    });
  },

  async sendGrid(email, options) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const { html, text } = await generateEmailTemplate(options);
    const msg = {
      to: `${email}`,
      from: BALLERS_NO_REPLY_EMAIL,
      subject: `${options.subject}`,
      text,
      html,
    };
    sgMail.send(msg);
  },
};

export const sendMail = (defaultMailContent, user, additionalOptions = {}) => {
  if (!user.email) {
    throw new Error('Email is needed to send email');
  }

  const { email } = user;

  // get options
  const options = {
    ...defaultMailContent,
    ...additionalOptions,
    firstName:
      user.vendor && user.vendor.companyName ? user.vendor.companyName : user.firstName || null,
  };

  return process.env.NODE_ENV === 'production'
    ? MailSender.sendGrid(email, options)
    : MailSender.mailTrap(email, options);
};
