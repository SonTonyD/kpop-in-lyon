import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { ActiveEventStoreService } from './services/active-event-store.service';

function preloadActiveEvent(activeEventStore: ActiveEventStoreService): () => Promise<void> {
  return () => activeEventStore.load();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      useFactory: preloadActiveEvent,
      deps: [ActiveEventStoreService],
      multi: true,
    },
  ],
};
