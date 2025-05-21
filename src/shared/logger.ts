import { createLogger, format, transports } from 'winston';
import config from '../config/config';

const { combine, timestamp, label, printf, colorize } = format;

// Usa variáveis de ambiente ou valores padrão
const logLevel = config.log.level;
const logLabel = config.log.label;

const formatter = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
    level: logLevel,
    format: combine(
        colorize(),
        label({ label: logLabel }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        formatter,
    ),
    transports: [new transports.Console()],
});

export default logger;
