import { createLogger, format, transports } from 'winston';
const { combine, timestamp, label, printf } = format;

const formatter = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
  format: combine(
    label({ label: 'MEVO-PROCESSOR'}),
    timestamp(),
    formatter
  ),
  transports: [new transports.Console()]
});

export default logger;