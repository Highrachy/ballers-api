export default ({ greeting, firstName, contentTop, contentBottom, buttonText, link }) => {
  let content = '';
  const hello = greeting || 'Hello';
  const greetings = firstName ? `${hello} ${firstName}` : hello;
  const button =
    link && buttonText
      ? `${buttonText} [${link}] \n\n or copy this url and view in a web browser ${link}`
      : '';
  content += (contentTop && contentTop.replace('<br>', '\n')) || '';
  content += contentBottom ? `\n\n${contentBottom.replace('<br>', '\n')}` : '';
  console.log('content', content, greetings, button);
  // Note: The text is formatted as it should appear on the device
  return `

  Good day,

  Hope this mail meets you well.

  This is to introduce to you our Investment and Technology Company.

  Highrachy Investment & Technology Ltd. is a technology and real estate company and our vision is to be a globally known one stop shop for value within the real estate and technology industries.

  We offer you quality investment opportunities through our top-notch structures built with style, taste, and functionality in mind.

  We have currently available 4units of 3bedroom flats with a maids quarters located off Orchid hotel road Chevron Lekki, Lagos.

  We are available for site inspection whenever you are ready, below are pictures of our ongoing project.

  To book a visit, please send me an email or call +234 7085389504.

  Looking forward to hearing from you.

  Thank you.
  Best Regards`;
};
