import { Result } from "neverthrow";
import {
  Event,
  EventRepository,
} from "@/domain/event";
import { DBError } from "@/domain/error";

export interface EventService {
  getEventById: (groupId: string, eventId: string) => Promise<Result<Event | null, DBError>>;
  getAllEvents: (groupId: string) => Promise<Result<Event[], DBError>>;
  createEvent: (groupId: string, eventData: Event) => Promise<Result<Event, DBError>>;
  updateEvent: (groupId: string, eventData: Event) => Promise<Result<Event, DBError>>;
  deleteEvent: (groupId: string, eventId: string) => Promise<Result<void, DBError>>;
}

export const createEventService = (eventRepository: EventRepository): EventService => ({
  /* イベントをIDで取得 */
  getEventById: async (groupId: string, eventId: string): Promise<Result<Event | null, DBError>> => {
    return await eventRepository.findById(groupId, eventId);
  },

  /* 全てのイベントを取得 */
  getAllEvents: async (groupId: string): Promise<Result<Event[], DBError>> => {
    return await eventRepository.findAll(groupId);
  },

  /* 新しいイベントを作成 */
  createEvent: async (
    groupId: string,
    eventData: Event,
  ): Promise<Result<Event, DBError>> => {
    return await eventRepository.create(groupId, eventData);
  },

  /* イベントを更新 */
  updateEvent: async (
    groupId: string,
    eventData: Event,
  ): Promise<Result<Event, DBError>> => {
    return await eventRepository.update(groupId, eventData);
  },

  /* イベントを削除 */
  deleteEvent: async (groupId: string, eventId: string): Promise<Result<void, DBError>> => {
    return await eventRepository.delete(groupId, eventId);
  },
});
