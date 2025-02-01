const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const PORT = process.env.PORT || 28900;

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Chat Service API',
            version: '1.0.0',
            description: 'API documentation for the Chat Service'
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Local server'
            }
        ]
    },
    apis: ['./src/app.js']
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

module.exports = {
    swaggerUi,
    swaggerDocs
};
