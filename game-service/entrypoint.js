import { createApp, logger } from "./src/app.js";
import { createServer } from "node:http";
import { format, transports } from "winston";
const PORT = process.env.PORT || 28999;

logger.add(
  new transports.Console({
    format: format.combine(format.timestamp(), format.splat(), format.json()),
  }),
);

const httpServer = createServer();

const { close } = await createApp(httpServer, { sessionSecrets: ["changeitplz1"] });

process.on("SIGTERM", async () => {

  logger.info("SIGTERM signal received");
  await close();
});

httpServer.listen(PORT, () => {
  logger.info("server listening at http://localhost:" + PORT);
});