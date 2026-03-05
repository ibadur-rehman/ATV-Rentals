import { createClient, ApiKeyStrategy  } from '@wix/sdk';
import * as calendar from '@wix/calendar';
import { DateTime } from 'luxon';

// TypeScript type definitions
type VehicleType = 'ATV' | 'UTV';

interface BookingRequest {
  startDateTime: string;
  toDateTime: string;
  rideDurationMinutes: number;
  scheduleNameOrId?: string;
  vehicleType: VehicleType;
  requestedQty?: number;
  suggestSlotsForWholeDay?: boolean;
}

interface WixEvent {
  id?: string;
  scheduleName?: string | null;
  title?: string | null;
  scheduleId?: string | null;
  adjustedStart?: { localDate: string | null | undefined };
  adjustedEnd?: { localDate: string | null | undefined };
  start?: { localDate: string | null | undefined };
  end?: { localDate: string | null | undefined };
  totalCapacity?: number;
  capacity?: number;
  remainingCapacity?: number;
  availableSpots?: number;
}

interface ProcessedEvent {
  id?: string;
  vehicleType: VehicleType | null;
  durationMinutes: number | null;
  scheduleName: string;
  scheduleId: string | null;
  start: string;
  end: string;
  totalCapacity?: number | null;
  remainingCapacity?: number | null;
  booked: number;
}

interface BookingResponse {
  canBook: boolean;
  message: string;
  slots?: ProcessedEvent[];
}

interface VehicleMapping {
  key: string;
  vehicleType: VehicleType;
  durationMinutes: number;
}

// After you have an OAuth token, client will include it automatically.
// Then query events same as above:

const FLEET: Record<VehicleType, number> = { ATV: 25, UTV: 2 };
const MIN_NEW_SLOT = 2; // cannot open new slot for 1 vehicle

const wixClient = createClient({
    modules: {
        calendar: calendar
    },
   auth: ApiKeyStrategy({
    apiKey: process.env.WIX_API_KEY!,
    siteId: process.env.WIX_SITE_ID!
  }),
});

/**
 * Lists calendar events between two ISO date strings.
 * @param {string} fromIso - Start date in ISO format.
 * @param {string} toIso - End date in ISO format.
 * @returns {Promise<Object>} - Result from Wix Calendar API.
 */
export async function CheckAvailability(body: any): Promise<BookingResponse> {

  if(!body || typeof body !== 'object') {
    return { canBook: false, message: 'Invalid request body' };
  }

    const { startDateTime, toDateTime, rideDurationMinutes, scheduleNameOrId, vehicleType, requestedQty = 1, suggestSlotsForWholeDay = false } = body;

    if(startDateTime == null || toDateTime == null || rideDurationMinutes == null || vehicleType == null) {
        return { canBook: false, message: `Missing required parameters ${startDateTime} or ${toDateTime} or ${rideDurationMinutes} or ${vehicleType}` };
    }

    if(!['ATV', 'UTV'].includes(vehicleType)) {
        return { canBook: false, message: 'Invalid vehicleType. Must be "ATV" or "UTV"' };
    }

    if(startDateTime >= toDateTime) {
        return { canBook: false, message: 'Invalid date range: startDateTime must be before toDateTime' };
    }

    const currentTime = DateTime.now().setZone("America/New_York")
    const checkStartTime = DateTime.fromISO(startDateTime, { zone: "America/New_York" })
      //.toISO({ suppressMilliseconds: true, includeOffset: false })!;


    if(checkStartTime <  currentTime && !suggestSlotsForWholeDay) {
        return { canBook: false, message: 'startDateTime must be in the future' };
    }

    const eventsQuery = wixClient.calendar.events.queryEvents({  fromLocalDate: startDateTime, toLocalDate: toDateTime , timeZone: 'America/New_York'});
    const result = await eventsQuery.limit(100).find();
    if(!(result as any)?._items?.length) return { canBook: false, message: 'No events found' };

    // Process events to determine availability
    // This is a simplified example; adjust logic as needed for your use case
    // For example, count existing bookings, check against capacity, etc.
    // Here, we assume each event has a 'capacity' and 'booked' field.
    const { data, alreadyBookedNos } = prepareInsightData((result as any)._items as WixEvent[], vehicleType);


    if(suggestSlotsForWholeDay)
    {
      let beautySlots =  data.map(ev => {
            return {
                id: ev.id,
                start: ev.start,
                end: ev.end,
                vehicleType: ev.vehicleType,
                durationMinutes: ev.durationMinutes,
                booked: ev.booked,
                scheduleName: ev.scheduleName,
                scheduleId: ev.scheduleId,
                // totalCapacity: ev.totalCapacity,
                // remainingCapacity: ev.remainingCapacity
            };
        }).filter(ev => ev.durationMinutes === rideDurationMinutes)
      if(beautySlots.length == 0)
      {
        return { canBook: false, message: 'No matching slots found' }
      }
      else if (requestedQty == 0 || requestedQty == null || requestedQty == undefined)
      {
        return { canBook: true, message: 'Available slots', slots: beautySlots.filter(ev => ev.booked > 0).slice(0, 2)};
      }
      else if (requestedQty == 1) {
        beautySlots = beautySlots.filter(ev => ev.booked > 0);
        if(beautySlots.length == 0) {
           return { canBook: false, message: `Ask for to look another slots. because can't open a new slot for only 1 vehicle. Minimum to open a new slot is ${MIN_NEW_SLOT}.`}
        } else {
          return { canBook: true, message: 'Availabled slots', slots: beautySlots.filter(ev => {
                    const slotStart = DateTime.fromISO(ev.start, { zone: 'America/New_York' });
                    const slotEnd = DateTime.fromISO(ev.end, { zone: 'America/New_York' });
                     const tenAM = slotEnd.set({ hour: 10, minute: 0, second: 0, millisecond: 0 });
                    return (slotStart >= tenAM);
                         }).slice(0,2)}
        }
        }
      else if (requestedQty > 1) {
      
         return { canBook: true, message: 'Availabled slots', slots: beautySlots.filter(ev => {
           const slotStart = DateTime.fromISO(ev.start, { zone: 'America/New_York' });
           const slotEnd = DateTime.fromISO(ev.end, { zone: 'America/New_York' });
            const tenAM = slotEnd.set({ hour: 10, minute: 0, second: 0, millisecond: 0 });
           return (slotStart >= tenAM);
                }).slice(0,2)}
      } else {
        return { canBook: false, message: 'No matching slots found' };
      }
        // find all slots for the day
        // const slots = beautySlots.filter(ev => ev.booked > 0 && ev.durationMinutes === rideDurationMinutes);

        // if(slots.length === 0) {
        //   return { canBook: true, message: 'Available slots', slots: beautySlots.filter(ev => ev.durationMinutes === rideDurationMinutes).slice(0, 2)};
        // }
        // return { canBook: true, message: 'Available slots', slots };
    }

    const availableSpots = (FLEET[vehicleType as VehicleType]) - alreadyBookedNos;
    const requestedSlot = findRequestedSlots(data, rideDurationMinutes, vehicleType, startDateTime, toDateTime);
    if(!requestedSlot) return { canBook: false, message: 'No matching slots found' };

    if (requestedSlot.booked == 0 && requestedQty < MIN_NEW_SLOT) {
        return {
          canBook: false,
          message: `Ask for to look another slots. because can't open a new slot for only 1 vehicle. Minimum to open a new slot is ${MIN_NEW_SLOT}.`,
        };
      }

  console.log('availableSpots', availableSpots, 'requestedQty', requestedQty, 'requestedSlot', requestedSlot)

    const canBook = availableSpots >= requestedQty && (requestedSlot?.remainingCapacity ?? 0) >= requestedQty;

    return  {
      canBook,
      message: canBook ? 'Requested slot is available' : 'Requested slot is not available',
    };
}

function prepareInsightData(events: WixEvent[] = [], vehicleType: VehicleType): { data: ProcessedEvent[], alreadyBookedNos: number } {
  let alreadyBookedNos = 0;

  let data = events
    .map(ev => {


      const find = findVehicleType(ev);

      alreadyBookedNos += (find?.vehicleType === vehicleType ? ((ev.totalCapacity ?? 0) - (ev.remainingCapacity ?? 0)) : 0);

      return {
      vehicleType: find?.vehicleType || null,
      durationMinutes: find?.durationMinutes || null,
      scheduleName: ev.scheduleName || ev.title || '',
      scheduleId: ev.scheduleId || null,
      start: ev.adjustedStart?.localDate || ev.start?.localDate || '',
      end: ev.adjustedEnd?.localDate || ev.end?.localDate || '',
      totalCapacity: ev.totalCapacity ?? ev.capacity ?? null,
      remainingCapacity: ev.remainingCapacity ?? ev.availableSpots ?? null,
      booked: (ev.totalCapacity ?? 0) - (ev.remainingCapacity ?? 0)
      }
}).filter(ev => ev.vehicleType === vehicleType);
return { data, alreadyBookedNos };
}

function findVehicleType(ev: WixEvent): { vehicleType: VehicleType; durationMinutes: number } | null {
   const name = (ev?.scheduleName || ev?.title || '').toString().toLowerCase();
      const map = [
        { key: '2 hour guided atv', vehicleType: 'ATV' as VehicleType, durationMinutes: 120 },
        { key: '1 hour guided atv', vehicleType: 'ATV' as VehicleType, durationMinutes: 60 },
        { key: '45', vehicleType: 'ATV' as VehicleType, durationMinutes: 45 }, // matches "45 Min" etc.
        { key: '2 hour utv', vehicleType: 'UTV' as VehicleType, durationMinutes: 120 },
        { key: '1 hour utv', vehicleType: 'UTV' as VehicleType, durationMinutes: 60 },
        { key: 'spooky', vehicleType: 'ATV' as VehicleType, durationMinutes: 60 },
        { key: 'takeovers give back', vehicleType: 'ATV' as VehicleType, durationMinutes: 90 }
      ];
      for (const m of map) if (name.includes(m.key)) return { vehicleType: m.vehicleType, durationMinutes: m.durationMinutes };
      return null; // unknown -> let caller handle
}

function findRequestedSlots(data: ProcessedEvent[] = [], rideDurationMinutes: number, vehicleType: VehicleType, fromDateTime: string, toDateTime: string): ProcessedEvent | undefined {
  return data.find(ev => {
    return (ev?.vehicleType === vehicleType && ev?.durationMinutes === rideDurationMinutes && ev.start >= fromDateTime && ev.end <= toDateTime);
  });
}