import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';

const routesPath = path.join(__dirname, './../**/*.js');

const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Ballers API',
      version: '1.0.0',
      description: 'API documentation for Ballers from Highrachy',
      license: {
        name: 'MIT',
        url: 'https://choosealicense.com/licenses/mit/',
      },
      contact: {
        name: 'Ballers',
        url: 'https://ballers.ng',
        email: 'info@ballers.ng',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
      },
    ],
  },
  apis: [routesPath],
};

export default swaggerJsdoc(options);
