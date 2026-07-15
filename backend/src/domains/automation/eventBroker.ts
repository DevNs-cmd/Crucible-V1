import Redis from 'ioredis';
import RedisMock from 'redis-mock';

// Define the strongly-typed event structure based on your CRM actions
export type CRMEventType = 'lead.created' | 'lead.updated' | 'followup.due' | 'ai_job.completed' | 'ai_job.failed';

export interface CRMEvent {
  id: string;
  type: CRMEventType;
  payload: Record<string, any>;
  timestamp: string;
}

class EventBroker {
  private publisher: any;
  private subscriber: any;
  private localListeners: Map<CRMEventType, Function[]> = new Map();
  private isMock: boolean = false;

  constructor() {
    // Fall back to redis-mock if no explicit host is provided in the future
    if (process.env.REDIS_HOST) {
      console.log('[Event Broker] Connecting to Live Redis instance...');
      this.publisher = new Redis({ host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT) || 6379 });
      this.subscriber = new Redis({ host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT) || 6379 });
    } else {
      console.log('[Event Broker] No REDIS_HOST configured. Initializing isolated Redis Mock fallback layer...');
      this.publisher = RedisMock.createClient();
      this.subscriber = RedisMock.createClient();
      this.isMock = true;
    }

    this.setupSubscriptionHandling();
  }

  /**
   * Set up global message processing loop
   */
  private setupSubscriptionHandling() {
    if (this.isMock) {
      // redis-mock uses classic event emitter syntax for messages
      this.subscriber.on('message', (channel: string, message: string) => {
        this.dispatch(channel as CRMEventType, JSON.parse(message));
      });
    } else {
      // ioredis syntax
      this.subscriber.on('message', (channel: CRMEventType, message: string) => {
        this.dispatch(channel, JSON.parse(message));
      });
    }
  }

  /**
   * Publishes an asynchronous event down our system streams
   */
  public async publish(type: CRMEventType, payload: Record<string, any>): Promise<void> {
    const event: CRMEvent = {
      id: `evt-${Math.random().toString(36).substring(2, 11)}`,
      type,
      payload,
      timestamp: new Date().toISOString()
    };

    const messageString = JSON.stringify(event);
    console.log(`[Event Broker] 📢 Publishing Event: ${type} (${event.id})`);

    if (this.isMock) {
      this.publisher.publish(type, messageString);
    } else {
      await this.publisher.publish(type, messageString);
    }
  }

  /**
   * Subscribes handlers to specific CRM topics
   */
  public subscribe(type: CRMEventType, callback: (event: CRMEvent) => void | Promise<void>): void {
    if (!this.localListeners.has(type)) {
      this.localListeners.set(type, []);
      // Tell Redis client to listen to this specific channel stream
      this.subscriber.subscribe(type);
    }
    this.localListeners.get(type)!.push(callback);
  }

  /**
   * Internally dispatches incoming messages out to register callbacks
   */
  private dispatch(type: CRMEventType, event: CRMEvent) {
    const handlers = this.localListeners.get(type) || [];
    handlers.forEach((handler) => {
      try {
        handler(event);
      } catch (err) {
        console.error(`[Event Broker Error] Exception caught handling subscription thread:`, err);
      }
    });
  }
}

// Export a single centralized singleton instance across the backend instance space
export const eventBroker = new EventBroker();