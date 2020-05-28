module.exports = ({ greeting, firstName, contentTop, contentBottom, buttonText, link }) => {
  let content = '';
  const hello = greeting || 'Hello';
  const greetings = firstName ? `${hello} ${firstName}` : hello;
  const button =
    link && buttonText
      ? `${buttonText} [${link}] \n\n or copy this url and view in a web browser ${link}`
      : '';
  content += (contentTop && contentTop.replace('<br>', '\n')) || '';
  content += contentBottom ? `\n\n${contentBottom.replace('<br>', '\n')}` : '';

  // Note: The text is formatted as it should appear on the device
  return `

${greetings},

${content.replace(/<[^>]+>/g, '')}

${button}

Thank you,
BALLERS TEAM.`;
};
