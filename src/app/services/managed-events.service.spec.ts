import {
  DEFAULT_EVENT_DOMINANT_COLOR,
  managedEventToEventInfo,
  mapManagedEvent,
} from './managed-events.service';

describe('ManagedEventsService mapping', () => {
  const baseRow = {
    id: 'event-1',
    title: 'SEVENTEEN EVENT',
    description: 'Fan event',
    starts_at: '2026-05-19T17:00:00.000Z',
    date_label: '19 mai 2026',
    time_label: '19:00',
    location: 'Lyon',
    country: 'France',
    format: 'Fan event',
    capacity: '250 people',
    image: 'https://example.com/poster.jpeg',
    image_path: 'event-1/poster.jpeg',
    dominant_color: '#123abc',
    is_active: true,
    created_at: '2026-05-01T10:00:00.000Z',
  };

  it('maps poster metadata from Supabase rows', () => {
    const event = mapManagedEvent(baseRow);

    expect(event.image).toBe(baseRow.image);
    expect(event.imagePath).toBe(baseRow.image_path);
    expect(event.dominantColor).toBe(baseRow.dominant_color);
  });

  it('falls back to the default dominant color for older rows', () => {
    const event = mapManagedEvent({
      ...baseRow,
      image_path: null,
      dominant_color: null,
    });

    expect(event.imagePath).toBeNull();
    expect(event.dominantColor).toBe(DEFAULT_EVENT_DOMINANT_COLOR);
  });

  it('exposes dominant color to public event info', () => {
    const event = mapManagedEvent(baseRow);
    const eventInfo = managedEventToEventInfo(event);

    expect(eventInfo.image).toBe(baseRow.image);
    expect(eventInfo.dominantColor).toBe(baseRow.dominant_color);
  });
});
