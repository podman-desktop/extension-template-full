/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Webview, Disposable } from '@podman-desktop/api';
import { noTimeoutChannels } from './NoTimeoutChannels';

export interface IMessage {
  id: number;
  channel: string;
}

export interface IMessageRequest extends IMessage {
  args: unknown[];
}

export interface IMessageResponse extends IMessageRequest {
  status: 'error' | 'success';
  error?: string;
  body: unknown;
}

export interface ISubscribedMessage {
  id: string;
  body: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UnaryRPC = (...args: any[]) => Promise<unknown>;

export function isMessageRequest(content: unknown): content is IMessageRequest {
  return !!content && typeof content === 'object' && 'id' in content && 'channel' in content;
}

export function isMessageResponse(content: unknown): content is IMessageResponse {
  return isMessageRequest(content) && 'status' in content;
}

export class RpcExtension implements Disposable {
  #webviewDisposable: Disposable | undefined;
  methods: Map<string, (...args: unknown[]) => Promise<unknown>> = new Map();

  constructor(private webview: Webview) {}

  dispose(): void {
    this.#webviewDisposable?.dispose();
  }

  init(): void {
    this.#webviewDisposable = this.webview.onDidReceiveMessage(async (message: unknown) => {
      if (!isMessageRequest(message)) {
        console.error('Received incompatible message.', message);
        return;
      }

      if (!this.methods.has(message.channel)) {
        console.error(
          `Trying to call on an unknown channel ${message.channel}. Available: ${Array.from(this.methods.keys())}`,
        );
        throw new Error('channel does not exist.');
      }

      try {
        const result = await this.methods.get(message.channel)?.(...message.args);
        await this.webview.postMessage({
          id: message.id,
          channel: message.channel,
          body: result,
          status: 'success',
        } as IMessageResponse);
      } catch (err: unknown) {
        let errorMessage: string;
        // Depending on the object throw we try to extract the error message
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        } else {
          errorMessage = String(err);
        }

        await this.webview.postMessage({
          id: message.id,
          channel: message.channel,
          body: undefined,
          status: 'error',
          error: errorMessage,
        } as IMessageResponse);
      }
    });
  }

  registerInstance<T extends Record<keyof T, UnaryRPC>>(
    classType: { CHANNEL: string; prototype: T },
    instance: T,
  ): void {
    const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(instance)).filter(
      name => name !== 'constructor' && typeof instance[name as keyof T] === 'function',
    );

    methodNames.forEach(name => {
      const method = (instance[name as keyof T] as any).bind(instance);
      this.register(`${classType.CHANNEL}-${name}`, method);
    });
  }

  register(channel: string, method: (body: any) => Promise<any>): void {
    this.methods.set(channel, method);
  }
}

export interface Subscriber {
  unsubscribe(): void;
}

export class RpcBrowser {
  counter: number = 0;
  promises: Map<number, { resolve: (value: unknown) => unknown; reject: (value: unknown) => void }> = new Map();
  subscribers: Map<string, (msg: any) => void> = new Map();

  getUniqueId(): number {
    return ++this.counter;
  }

  constructor(
    private window: Window,
    private api: PodmanDesktopApi,
  ) {
    this.init();
  }

  init(): void {
    this.window.addEventListener('message', (event: MessageEvent) => {
      const message = event.data;
      if (isMessageResponse(message)) {
        if (!this.promises.has(message.id)) {
          console.error('Unknown message id.');
          return;
        }

        const { resolve, reject } = this.promises.get(message.id) ?? {};

        if (message.status === 'error') {
          reject?.(message.error);
        } else {
          resolve?.(message.body);
        }
        this.promises.delete(message.id);
      } else if (this.isSubscribedMessage(message)) {
        const handler = this.subscribers.get(message.id);
        handler?.(message.body);
      } else {
        console.error('Received incompatible message.', message);
        return;
      }
    });
  }

  getProxy<T>(classType: { CHANNEL: string; prototype: T }): T {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const thisRef = this;
    const proxyHandler: ProxyHandler<object> = {
      get(target, prop, receiver) {
        if (typeof prop === 'string') {
          return (...args: unknown[]) => {
            const channel = prop.toString();
            return thisRef.invoke(`${classType.CHANNEL}-${channel}`, ...args);
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    };

    return new Proxy({}, proxyHandler) as T;
  }

  async invoke(channel: string, ...args: unknown[]): Promise<unknown> {
    // Generate a unique id for the request
    const requestId = this.getUniqueId();

    const promise = new Promise((resolve, reject) => {
      this.promises.set(requestId, { resolve, reject });
    });

    // Post the message
    this.api.postMessage({
      id: requestId,
      channel: channel,
      args: args,
    } as IMessageRequest);

    // Add some timeout
    if (!noTimeoutChannels.includes(channel)) {
      setTimeout(() => {
        const { reject } = this.promises.get(requestId) ?? {};
        if (!reject) return;
        reject(new Error('Timeout'));
        this.promises.delete(requestId);
      }, 5000);
    }

    // Create a Promise
    return promise;
  }

  subscribe(msgId: string, f: (msg: any) => void): Subscriber {
    this.subscribers.set(msgId, f);
    return {
      unsubscribe: (): void => {
        this.subscribers.delete(msgId);
      },
    };
  }

  isSubscribedMessage(content: any): content is ISubscribedMessage {
    return !!content && 'id' in content && 'body' in content && this.subscribers.has(content.id);
  }
}
