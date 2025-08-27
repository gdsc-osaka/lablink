import { parseISO, compareAsc, isAfter, max, isBefore } from 'date-fns';

interface TimeInterval {
  start: string;
  end: string;
}

interface DateInterval {
  start: Date;
  end: Date;
}

export function findCommonFreeSlots(
  busyIntervals: TimeInterval[],
  searchStart: string,
  searchEnd: string
): DateInterval[] {
  const searchStartDate = parseISO(searchStart);
  const searchEndDate = parseISO(searchEnd);

  if (busyIntervals.length === 0) {
    return [{ start: searchStartDate, end: searchEndDate }];
  }

  const sortedBusy: DateInterval[] = busyIntervals
    .map(interval => ({
      start: parseISO(interval.start),
      end: parseISO(interval.end),
    }))
    .sort((a, b) => compareAsc(a.start, b.start));

  const mergedBusy: DateInterval[] = [];
  if (sortedBusy.length > 0) {
    let currentMerge = { ...sortedBusy[0] };

    for (let i = 1; i < sortedBusy.length; i++) {
      const nextInterval = sortedBusy[i];
      if (!isAfter(nextInterval.start, currentMerge.end)) {
        currentMerge.end = max([currentMerge.end, nextInterval.end]);
      } else {
        mergedBusy.push(currentMerge);
        currentMerge = { ...nextInterval };
      }
    }
    mergedBusy.push(currentMerge);
  }

  const freeSlots: DateInterval[] = [];
  let lastBusyEnd = searchStartDate;

  for (const busy of mergedBusy) {
    if (isAfter(busy.start, lastBusyEnd)) {
      freeSlots.push({ start: lastBusyEnd, end: busy.start });
    }
    lastBusyEnd = max([lastBusyEnd, busy.end]);
  }

  if (isBefore(lastBusyEnd, searchEndDate)) {
    freeSlots.push({ start: lastBusyEnd, end: searchEndDate });
  }

  return freeSlots;
}