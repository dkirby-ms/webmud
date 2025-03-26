# webMUD

This project is an interactive web-based MUD built with a modular, scalable architecture.

## Features
- Real-time multiplayer gameplay
- Old-school command line gameplay and socials
- Play through the browser
- Scalable architecture could support many concurrent users/large battles
  
## Architecture

![architecture diagram](./docs/img/architecture.png)

### Client
webMUD's [client](./webmud_client/README.md) is a NextJS single page app (SPA) (./webmud_client/README.md) that players use to login, create characters, and connect to game servers. 

## Usage
webMUD architecture consists of a NextJS-based front-end application (./webmud_client), a back-end NodeJS and Socket.io-based game service, and various other tools. Data persistence is handled with MongoDB and authentication and authorization is managed with Azure Active Directory B2C. 

## Contributing
Contributions are closed at this time. 

