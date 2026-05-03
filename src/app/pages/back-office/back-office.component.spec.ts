import { FormBuilder } from '@angular/forms';
import { BackOfficeComponent } from './back-office.component';
import { ManagedEvent, ManagedEventPayload } from '../../services/back-office.types';

describe('BackOfficeComponent event poster form', () => {
  it('keeps the existing poster when an event is saved without a new file', async () => {
    let updatedPayload!: ManagedEventPayload;
    const event = buildManagedEvent();
    const managedEventsService = {
      updateEvent: async (_id: string, payload: ManagedEventPayload) => {
        updatedPayload = payload;
        return { ...event, ...payload };
      },
      uploadPoster: jasmine.createSpy('uploadPoster'),
      deletePoster: jasmine.createSpy('deletePoster'),
    };
    const component = new BackOfficeComponent(
      { signOut: async () => undefined } as never,
      {} as never,
      {} as never,
      managedEventsService as never,
      {} as never,
      {} as never,
      new FormBuilder(),
      { navigateByUrl: async () => true } as never,
    );

    (component as any).managedEvents.set([event]);
    (component as any).editManagedEvent(event);
    await (component as any).saveManagedEvent();

    expect(managedEventsService.uploadPoster).not.toHaveBeenCalled();
    expect(updatedPayload.image).toBe(event.image);
    expect(updatedPayload.imagePath).toBe(event.imagePath);
    expect(updatedPayload.dominantColor).toBe(event.dominantColor);
  });
});

function buildManagedEvent(): ManagedEvent {
  return {
    id: 'event-1',
    title: 'SEVENTEEN EVENT',
    description: 'Fan event',
    startsAt: '2026-05-19T17:00:00.000Z',
    dateLabel: '19 mai 2026',
    timeLabel: '19:00',
    location: 'Lyon',
    country: 'France',
    format: 'Fan event',
    capacity: '250 people',
    image: 'https://example.com/poster.jpeg',
    imagePath: 'event-1/poster.jpeg',
    dominantColor: '#123abc',
    isActive: true,
    createdAt: '2026-05-01T10:00:00.000Z',
  };
}
