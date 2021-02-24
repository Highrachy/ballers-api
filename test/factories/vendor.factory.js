import { Factory } from 'rosie';

export default new Factory()
  .attr('companyName', 'Highrachy Investment Limited')
  .attr('companyLogo', 'logo.jpg')
  .attr('verified', true)
  .attr('phone', '08012345678')
  .attr('bankInfo', {
    accountName: 'John Doe',
    accountNumber: '0123456789',
    bankName: 'ABC Bank',
  })
  .attr('identification', {
    url: 'https://ballers.ng/tax-filing.png',
    type: 'Tax filing',
  })
  .attr('redanNumber', '1122334455')
  .attr('taxCertificate', 'tax.jpg')
  .attr('entity', 'Company')
  .attr('directors', [
    {
      name: 'Jane Doe',
      isSignatory: false,
      phone: '08012345678',
    },
  ])
  .attr('socialMedia', [
    {
      name: 'Instagram',
      url: 'https://instagram.com/highrachy',
    },
  ]);
