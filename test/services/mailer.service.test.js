import { expect, sinon } from '../config';
import { generateEmailTemplate, sendMail, MailSender } from '../../server/services/mailer.service';
import MAILER_CONTENT from '../../mailer';
import userFactory from '../factories/user.factory';

let options;
const generateOptions = (newOptions = {}) => ({ ...MAILER_CONTENT.DEFAULT, ...newOptions });

describe('Mailer Service', () => {
  describe('#generateEmailTemplate', () => {
    context('when all options are given', () => {
      beforeEach(() => {
        options = generateOptions();
      });
      it('builds a valid html template', async () => {
        const email = await generateEmailTemplate(options);
        expect(email.html).to.contain(options.buttonText);
        expect(email.html).to.contain(options.contentBottom);
        expect(email.html).to.contain(options.contentTop);
        expect(email.html).to.contain(options.firstName);
        expect(email.html).to.contain(options.greeting);
        expect(email.html).to.contain(options.link);
        expect(email.html).to.contain(options.subject); // subject is used as title in html template
      });
      it('builds a valid text template', async () => {
        const email = await generateEmailTemplate(options);
        expect(email.text).to.contain(options.buttonText);
        expect(email.text).to.contain(options.contentBottom);
        expect(email.text).to.contain(options.contentTop);
        expect(email.text).to.contain(options.firstName);
        expect(email.text).to.contain(options.greeting);
        expect(email.text).to.contain(options.link);
      });
    });

    context('when buttonText is not given', () => {
      beforeEach(() => {
        options = generateOptions({ buttonText: undefined });
      });
      it('omits link in html template', async () => {
        const email = await generateEmailTemplate(options);
        expect(email.html).to.not.contain(options.link);
      });
      it('omits link in text template', async () => {
        const email = await generateEmailTemplate(options);
        expect(email.text).to.not.contain(options.link);
      });
    });

    context('when contentTop is not given', () => {
      beforeEach(() => {
        options = generateOptions({ contentTop: undefined });
      });
      it('displays contentBottom', async () => {
        const email = await generateEmailTemplate(options);
        expect(email.html).to.contain(options.contentBottom);
      });
      it('omits link in text template', async () => {
        const email = await generateEmailTemplate(options);
        expect(email.text).to.contain(options.contentBottom);
      });
    });

    context('when contentBottom is not given', () => {
      beforeEach(() => {
        options = generateOptions({ contentBottom: undefined });
      });
      it('displays contentBottom', async () => {
        const email = await generateEmailTemplate(options);
        expect(email.html).to.contain(options.contentTop);
      });
      it('omits link in text template', async () => {
        const email = await generateEmailTemplate(options);
        expect(email.text).to.contain(options.contentTop);
      });
    });

    context('when firstName is not given', () => {
      beforeEach(() => {
        options = generateOptions({ firstName: undefined });
      });
      it('displays only the greeting text in html template', async () => {
        const email = await generateEmailTemplate(options);
        expect(email.html).to.contain(`${options.greeting},`);
      });
      it('omits firstName in text template', async () => {
        const email = await generateEmailTemplate(options);
        expect(email.html).to.contain(`${options.greeting},`);
      });
    });

    context('when greetings is not given', () => {
      beforeEach(() => {
        options = generateOptions({ greeting: undefined });
      });
      it('shows the default greetings with firstName in html', async () => {
        const email = await generateEmailTemplate(options);
        expect(email.html).to.contain(`Hello ${options.firstName},`);
      });
      it('shows the default greetings with firstName in text', async () => {
        const email = await generateEmailTemplate(options);
        expect(email.text).to.contain(`Hello ${options.firstName},`);
      });
    });

    context('when link is not given', () => {
      beforeEach(() => {
        options = generateOptions({ link: undefined });
      });
      it('omits buttonText and link in html template', async () => {
        const email = await generateEmailTemplate(options);
        expect(email.html).to.not.contain(options.buttonText);
      });
      it('omits buttonText and link in text template', async () => {
        const email = await generateEmailTemplate(options);
        expect(email.text).to.not.contain(options.buttonText);
      });
    });
  });

  describe('#sendMail', () => {
    const user = userFactory.build();
    const defaultMailContent = generateOptions();
    const sandbox = sinon.createSandbox();
    let mailTrapStub;
    let sendGridStub;

    beforeEach(() => {
      mailTrapStub = sandbox.stub(MailSender, 'mailTrap');
      sendGridStub = sandbox.stub(MailSender, 'sendGrid');
    });

    afterEach(() => {
      sandbox.restore();
    });

    context('on production server', () => {
      before(() => {
        process.env.NODE_ENV = 'production';
      });
      after(() => {
        process.env.NODE_ENV = 'test';
      });

      it('sends mail to email via sendgrid', () => {
        sendMail(defaultMailContent, user);
        expect(mailTrapStub.callCount).to.eq(0);
        expect(sendGridStub.callCount).to.eq(1);
        expect(sendGridStub).to.have.be.calledWith(user.email, {
          ...defaultMailContent,
          firstName: user.firstName,
        });
      });
    });

    context('on development server', () => {
      before(() => {
        process.env.NODE_ENV = 'development';
      });
      after(() => {
        process.env.NODE_ENV = 'test';
      });

      it('sends mail to email via mail trap', () => {
        sendMail(defaultMailContent, user);
        expect(mailTrapStub.callCount).to.eq(1);
        expect(sendGridStub.callCount).to.eq(0);
        expect(mailTrapStub).to.have.be.calledWith(user.email, {
          ...defaultMailContent,
          firstName: user.firstName,
        });
      });
    });

    context('when email address is absent', () => {
      it('throws an error', () => {
        expect(() => sendMail(defaultMailContent, {})).to.throw('Email is needed to send email');
        expect(mailTrapStub.callCount).to.eq(0);
        expect(sendGridStub.callCount).to.eq(0);
      });
    });

    context('when firstName is absent', () => {
      it('it sends the mail', () => {
        const userWithNoFirstName = userFactory.build({ firstName: '' });
        sendMail(defaultMailContent, userWithNoFirstName);
        expect(mailTrapStub.callCount).to.eq(1);
        expect(sendGridStub.callCount).to.eq(0);
        expect(mailTrapStub).to.have.be.calledWith(userWithNoFirstName.email, {
          ...defaultMailContent,
          firstName: null,
        });
      });
    });
  });
});
