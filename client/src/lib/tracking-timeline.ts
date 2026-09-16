export type TrackingTimelineEvent = {
  complete?: boolean;
  current?: boolean;
};

/** Only stages that have been reached are customer-visible. */
export function getReachedTrackingEvents<T extends TrackingTimelineEvent>(events: T[]): T[] {
  return events.filter((event) => Boolean(event.complete || event.current));
}
