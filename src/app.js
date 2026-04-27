const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('./config/app-config');
const jwtAuth = require('./middlewares/jwtAuth');
const addUsernameToResponse = require('./middlewares/addUsernameToResponse');
const { initElasticsearch } = require('./config/elasticsearch-config');
const cors = require('cors');
const OpenApiValidator = require('express-openapi-validator');
const logger = require('./utils/logger');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');

const app = express();
const swaggerDocument = YAML.parse(
  fs.readFileSync(path.join(__dirname, './api/openapi.yaml'), 'utf8')
);

function loadRoutes(app) {
  const routesPath = path.join(__dirname, 'routes');
  fs.readdirSync(routesPath).forEach((file) => {
    if (file.endsWith('.js')) {
      const route = require(path.join(routesPath, file));
      app.use(`/api/${config.API_VERSION}`, route);
    }
  });
}

// Parse application/json with size limit
app.use(express.json({ limit: '100kb' }));

// Set up CORS
app.use(cors());

// Add middleware to check authentication
app.use(jwtAuth);

// Add username to local res
app.use(addUsernameToResponse);

// Set up OpenAPI Validator Middleware
app.use(
  OpenApiValidator.middleware({
    apiSpec: path.join(__dirname, './api/openapi.yaml'),
    validateRequests: true,
    validateResponses: true,
  })
);

// Set up the Swagger UI route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Load all the Routes
loadRoutes(app);

// Error handling middleware (must be after routes)
app.use((err, req, res, next) => {
  if (err.status && err.status < 500) {
    res.status(err.status).json({
      message: err.message,
      errors: err.errors,
    });
  } else {
    logger.error(`Unhandled error: ${err.message}`);
    res.status(err.status || 500).json({
      message: 'Internal server error',
    });
  }
});


async function startService() {
  await initElasticsearch();
  app.listen(config.PORT, () => {
    logger.info(`Server running on port ${config.PORT}`);
  });
}

startService();


