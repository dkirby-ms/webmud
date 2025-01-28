const express = require('express');
const mqtt = require('mqtt');
const cors = require('cors');
const app = express();
app.use(cors());
const port = process.env.PORT || 28998; // Use the PORT environment variable or default to 3000
const mqttServer = process.env.MQTT_SERVER || 'mqtt://localhost:1883';
const mqttOptions = {
    username: process.env.MQTT_USER || 'game1',
    password: process.env.MQTT_PASSWORD || 'Passw0rd123!!'
};

app.use(express.json());

app.post('/loginUser', (req, res) => {
    const userAccountInfo = JSON.parse(req.body);
    // send message to mqtt
    const client = mqtt.connect(mqttServer, mqttOptions);
    client.on('connect', () => {
        client.publish('Users/Auth', JSON.stringify(body));
        client.end();
    });
    console.log('User login from ' + userAccountInfo.username + ' published to MQTT.');
    res.send('User login from ' + userAccountInfo.username + ' published to MQTT.');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});