import { expect, request } from '../config';
import MAILER_CONTENT from '../../mailer';

const options = MAILER_CONTENT.DEFAULT;

const expectsMailerToDisplayTheRightContent = (template) => {
  expect(template).to.contain(options.buttonText);
  expect(template).to.contain(options.contentBottom);
  expect(template).to.contain(options.contentTop);
  expect(template).to.contain(options.firstName);
  expect(template).to.contain(options.greeting);
  expect(template).to.contain('http://ballers.ng/');
};

describe('Mailer Route', () => {
  context('with no params', () => {
    it('returns the default mailer', (done) => {
      request()
        .get('/mailer/templates')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.text).to.contain('<html>');
          expectsMailerToDisplayTheRightContent(res.text);
          done();
        });
    });
  });

  context('with params is set to text', () => {
    it('returns the text default mailer', (done) => {
      request()
        .get('/mailer/templates?type=text')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.text).to.not.contain('<html>');
          expectsMailerToDisplayTheRightContent(res.text);
          done();
        });
    });
  });

  context('with params is set anything but text', () => {
    it('returns the html default mailer', (done) => {
      request()
        .get('/mailer/templates?type=html')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.text).to.contain('<html>');
          expectsMailerToDisplayTheRightContent(res.text);
          done();
        });
    });
  });

  context('with invalid content type', () => {
    it('returns the default mailer', (done) => {
      request()
        .get('/mailer/templates?name=INVALID_NAME')
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body.message).to.eq('Email Template not found');
          done();
        });
    });
  });
});
