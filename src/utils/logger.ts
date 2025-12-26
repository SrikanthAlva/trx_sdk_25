/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Log entry
 */
export interface LogEntry {
	readonly level: LogLevel
	readonly message: string
	readonly timestamp: number
	readonly context?: Record<string, unknown>
	readonly error?: Error
}

/**
 * Logger interface
 */
export interface Logger {
	debug(message: string, context?: Record<string, unknown>): void
	info(message: string, context?: Record<string, unknown>): void
	warn(message: string, context?: Record<string, unknown>): void
	error(message: string, error?: Error, context?: Record<string, unknown>): void
}

/**
 * Console logger implementation
 */
class ConsoleLogger implements Logger {
	private readonly minLevel: LogLevel
	private readonly enabled: boolean

	constructor(enabled: boolean, minLevel: LogLevel = 'info') {
		this.enabled = enabled
		this.minLevel = minLevel
	}

	private shouldLog(level: LogLevel): boolean {
		if (!this.enabled) {
			return false
		}

		const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
		const currentLevelIndex = levels.indexOf(level)
		const minLevelIndex = levels.indexOf(this.minLevel)

		return currentLevelIndex >= minLevelIndex
	}

	private formatMessage(entry: LogEntry): string {
		const timestamp = new Date(entry.timestamp).toISOString()
		const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
		const errorStr = entry.error ? ` Error: ${entry.error.message}` : ''
		return `[${timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}${errorStr}`
	}

	debug(message: string, context?: Record<string, unknown>): void {
		if (this.shouldLog('debug')) {
			const entry: LogEntry = {
				level: 'debug',
				message,
				timestamp: Date.now(),
				context,
			}
			console.debug(this.formatMessage(entry))
		}
	}

	info(message: string, context?: Record<string, unknown>): void {
		if (this.shouldLog('info')) {
			const entry: LogEntry = {
				level: 'info',
				message,
				timestamp: Date.now(),
				context,
			}
			console.info(this.formatMessage(entry))
		}
	}

	warn(message: string, context?: Record<string, unknown>): void {
		if (this.shouldLog('warn')) {
			const entry: LogEntry = {
				level: 'warn',
				message,
				timestamp: Date.now(),
				context,
			}
			console.warn(this.formatMessage(entry))
		}
	}

	error(message: string, error?: Error, context?: Record<string, unknown>): void {
		if (this.shouldLog('error')) {
			const entry: LogEntry = {
				level: 'error',
				message,
				timestamp: Date.now(),
				context,
				error,
			}
			console.error(this.formatMessage(entry))
			if (error && error.stack) {
				console.error(error.stack)
			}
		}
	}
}

/**
 * No-op logger (disabled logging)
 */
class NoOpLogger implements Logger {
	debug(): void {
		// No-op
	}
	info(): void {
		// No-op
	}
	warn(): void {
		// No-op
	}
	error(): void {
		// No-op
	}
}

/**
 * Create a logger instance
 * @param enabled - Whether logging is enabled
 * @param level - Minimum log level
 * @returns Logger instance
 */
export function createLogger(enabled: boolean, level: LogLevel = 'info'): Logger {
	if (!enabled) {
		return new NoOpLogger()
	}
	return new ConsoleLogger(enabled, level)
}

/**
 * Default logger instance (disabled by default)
 */
let defaultLogger: Logger = new NoOpLogger()

/**
 * Set the default logger instance
 * @param logger - Logger instance to use
 */
export function setDefaultLogger(logger: Logger): void {
	defaultLogger = logger
}

/**
 * Get the default logger instance
 * @returns Default logger
 */
export function getLogger(): Logger {
	return defaultLogger
}

