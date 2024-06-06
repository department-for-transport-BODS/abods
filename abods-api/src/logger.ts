import pino, { Logger } from "pino";
import pretty, { PinoPretty } from "pino-pretty";

const stream: PinoPretty.PrettyStream = pretty({
  colorize: true,
  translateTime: "SYS:standard",
});

const logger: Logger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
  },
  stream
);

export default logger;
