const express = require('express');
const yaml = require('js-yaml');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors'); // Add this line
const app = express();
app.use(express.json());
app.use(cors()); // Add this line
const { OpenAPIBackend } = require('openapi-backend');
const api = new OpenAPIBackend({ definition: './openapi.yml' });
api.init();

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";

const openapiDoc = yaml.load(fs.readFileSync('./openapi.yml', 'utf8'));

api.register({
  getMobs: async (c, req, res) => {
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    const db = client.db("local");
    const docs = await db.collection("mobile-data").find({}).toArray();
    await client.close();
    return res.status(200).json(docs);
  },
  getMobById: (c, req, res) => {
    // Example handler for GET /mobs/{id}
    const { id } = c.request.params;
    return res.status(200).json({ id, /* ...mob data... */ });
  },
  notFound: (c, req, res) => {
    return res.status(404).json({ error: 'Not found' });
  },
  validationFail: (c, req, res) => {
    return res.status(400).json({ error: 'Validation failed', details: c.validation.errors });
  }
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));

app.use((req, res) => api.handleRequest(req, req, res));

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
