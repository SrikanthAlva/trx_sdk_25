/**
 * Queue item
 */
interface QueueItem<T> {
	readonly task: () => Promise<T>
	readonly resolve: (value: T) => void
	readonly reject: (error: Error) => void
	readonly priority?: number
}

/**
 * Request queue configuration
 */
export interface RequestQueueConfig {
	/** Maximum queue size */
	readonly maxSize?: number
	/** Process items concurrently */
	readonly concurrency?: number
	/** Enable priority queue */
	readonly priority?: boolean
}

/**
 * Request queue for managing concurrent requests
 */
export class RequestQueue<T = unknown> {
	private readonly maxSize: number
	private readonly concurrency: number
	private readonly priority: boolean
	private queue: QueueItem<T>[] = []
	private running = 0

	constructor(config: RequestQueueConfig = {}) {
		this.maxSize = config.maxSize || Infinity
		this.concurrency = config.concurrency || 1
		this.priority = config.priority || false
	}

	/**
	 * Add a task to the queue
	 * @param task - Task function to execute
	 * @param priority - Optional priority (higher = executed first)
	 * @returns Promise that resolves with task result
	 */
	async enqueue(task: () => Promise<T>, priority?: number): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			if (this.queue.length >= this.maxSize) {
				reject(new Error('Queue is full'))
				return
			}

			const item: QueueItem<T> = {
				task,
				resolve,
				reject,
				priority,
			}

			if (this.priority && priority !== undefined) {
				// Insert in priority order (higher priority first)
				const index = this.queue.findIndex((q) => (q.priority || 0) < priority)
				if (index === -1) {
					this.queue.push(item)
				} else {
					this.queue.splice(index, 0, item)
				}
			} else {
				this.queue.push(item)
			}

			this.process()
		})
	}

	/**
	 * Process queue items
	 */
	private async process(): Promise<void> {
		if (this.running >= this.concurrency || this.queue.length === 0) {
			return
		}

		const item = this.queue.shift()
		if (!item) {
			return
		}

		this.running++

		try {
			const result = await item.task()
			item.resolve(result)
		} catch (error) {
			item.reject(error instanceof Error ? error : new Error(String(error)))
		} finally {
			this.running--
			this.process()
		}
	}

	/**
	 * Get current queue size
	 */
	getSize(): number {
		return this.queue.length
	}

	/**
	 * Get number of running tasks
	 */
	getRunning(): number {
		return this.running
	}

	/**
	 * Clear the queue
	 */
	clear(): void {
		this.queue.forEach((item) => {
			item.reject(new Error('Queue cleared'))
		})
		this.queue = []
	}

	/**
	 * Wait for all queued tasks to complete
	 */
	async waitForCompletion(): Promise<void> {
		while (this.queue.length > 0 || this.running > 0) {
			await new Promise((resolve) => setTimeout(resolve, 10))
		}
	}
}

