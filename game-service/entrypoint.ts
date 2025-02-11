import { config } from "dotenv";
config(); // load .env file

import GameService from "./src/index.js";

// initialize the game service and start it
console.log("Initializing game service using configuration loaded from .env file");
const server = new GameService();
await server.init();
const { close } = await server.start();

process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received");
  // add additional shutdown logic
  await close();
});
 