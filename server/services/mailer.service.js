import appRoot from 'app-root-path';
import ejs from 'ejs';
import textEmailTemplate from '../../mailer/mailer.text.template';

const MAILER_HTML_TEMPLATE = `${appRoot}/mailer/mailer.html.template.ejs`;

// eslint-disable-next-line import/prefer-default-export
export const generateEmailTemplate = async (options) => {
  const html = await ejs.renderFile(MAILER_HTML_TEMPLATE, { ...options, async: true });
  const text = textEmailTemplate(options);
  return { html, text };
};
