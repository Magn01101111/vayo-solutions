import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, Renderer2, RendererFactory2, inject } from '@angular/core';

import { environment } from '../../../environment';

interface BotpressConfiguration {
  botName?: string;
  botDescription?: string;
  color?: string;
  variant?: string;
  themeMode?: string;
  radius?: number;
}

interface BotpressGlobal {
  init(config: {
    botId: string;
    clientId: string;
    hostUrl?: string;
    messagingUrl?: string;
    useSessionStorage?: boolean;
    configuration?: BotpressConfiguration;
  }): void;
}

declare global {
  interface Window {
    botpress?: BotpressGlobal;
  }
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly renderer: Renderer2 = inject(RendererFactory2).createRenderer(null, null);

  private loadPromise: Promise<void> | null = null;
  private initialized = false;

  init(): Promise<void> {
    const config = environment.chatbot;

    if (!isPlatformBrowser(this.platformId)) {
      return Promise.resolve();
    }

    if (!config.enabled || !config.botId || !config.clientId) {
      return Promise.resolve();
    }

    if (this.initialized) {
      return Promise.resolve();
    }

    if (!this.loadPromise) {
      this.loadPromise = this.loadScript(config.scriptUrl).then(() => {
        if (!window.botpress?.init) {
          throw new Error('Botpress no quedo disponible tras cargar el script.');
        }

        window.botpress.init({
          botId: config.botId,
          clientId: config.clientId,
          hostUrl: config.hostUrl,
          messagingUrl: config.messagingUrl,
          useSessionStorage: config.useSessionStorage,
          configuration: config.configuration,
        });

        this.initialized = true;
      }).catch((error) => {
        this.loadPromise = null;
        throw error;
      });
    }

    return this.loadPromise;
  }

  private loadScript(src: string): Promise<void> {
    const existing = this.document.querySelector<HTMLScriptElement>(
      'script[data-vayo-chatbot="botpress"]',
    );

    if (existing) {
      if (window.botpress?.init) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('No se pudo cargar Botpress.')), {
          once: true,
        });
      });
    }

    return new Promise((resolve, reject) => {
      const script = this.renderer.createElement('script') as HTMLScriptElement;
      script.src = src;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-vayo-chatbot', 'botpress');
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar el script del chatbot.'));
      this.renderer.appendChild(this.document.head, script);
    });
  }
}
