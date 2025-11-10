import { ResultAsync } from "neverthrow";
import { Event, EventRepository } from "@/domain/event";
import { DBError } from "@/domain/error";

export interface EventService {
    getEventById: (
        groupId: string,
        eventId: string,
    ) => ResultAsync<Event, DBError>;
    getAllEvents: (groupId: string) => ResultAsync<Event[], DBError>;
    createEvent: (
        groupId: string,
        eventData: Event,
    ) => ResultAsync<Event, DBError>;
    updateEvent: (
        groupId: string,
        eventData: Event,
    ) => ResultAsync<Event, DBError>;
    deleteEvent: (
        groupId: string,
        eventId: string,
    ) => ResultAsync<void, DBError>;
}

export const createEventService = (
    eventRepository: EventRepository,
): EventService => ({
    /* イベントをIDで取得 */
    getEventById: (
        groupId: string,
        eventId: string,
    ): ResultAsync<Event, DBError> => {
        return eventRepository.findById(groupId, eventId);
    },

    /* 全てのイベントを取得 */
    getAllEvents: (groupId: string): ResultAsync<Event[], DBError> => {
        return eventRepository.findAll(groupId);
    },

    /* 新しいイベントを作成 */
    createEvent: (
        groupId: string,
        eventData: Event,
    ): ResultAsync<Event, DBError> => {
        return eventRepository.create(groupId, eventData);
    },

    /* イベントを更新 */
    updateEvent: (
        groupId: string,
        eventData: Event,
    ): ResultAsync<Event, DBError> => {
        return eventRepository.update(groupId, eventData);
    },

    /* イベントを削除 */
    deleteEvent: (
        groupId: string,
        eventId: string,
    ): ResultAsync<void, DBError> => {
        return eventRepository.delete(groupId, eventId);
    },
});
