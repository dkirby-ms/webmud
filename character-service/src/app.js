const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

mongoose.connect('mongodb://localhost:27017/webmud', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const CharacterSchema = new mongoose.Schema({
  userId: String, 
  name: String,
  class: String,
  race: String
});
const Character = mongoose.model('Character', CharacterSchema);

const app = express();
app.use(bodyParser.json());


// Create a new character (POST /characters)
app.post('/characters', async (req, res) => {
  const charData = {
    userId: req.body.userId,
    name: req.body.name,
    class: req.body.class,
    race: req.body.race
  };
  const newChar = await Character.create(charData);
  res.json(newChar);
});

// Get all characters for a user (GET /characters)
app.get('/characters', async (req, res) => {
  // ...retrieve userId from session or token...
  const userId = req.query.userId;
  const chars = await Character.find({ userId });
  res.json(chars);
});

module.exports = app;
