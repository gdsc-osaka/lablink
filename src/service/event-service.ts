import {
  Event,
  EventRepository,
} from "@/domain/event";

export class EventService {
  constructor(private readonly eventRepository: EventRepository) {}

  /* イベントをIDで取得 */
  async getEventById(groupId: string, eventId: string): Promise<Event | null> {
    if (!groupId || groupId.trim() === "") {
      throw new Error("グループIDが指定されていません");
    }
    if (!eventId || eventId.trim() === "") {
      throw new Error("イベントIDが指定されていません");
    }
    return await this.eventRepository.findById(groupId, eventId);
  }

  /* 全てのイベントを取得 */
  async getAllEvents(groupId: string): Promise<Event[]> {
    if (!groupId || groupId.trim() === "") {
      throw new Error("グループIDが指定されていません");
    }
    return await this.eventRepository.findAll(groupId);
  }

  /* 新しいイベントを作成 */
  async createEvent(
    groupId: string,
    eventData: Event,
  ): Promise<Event> {
    if (!groupId || groupId.trim() === "") {
      throw new Error("グループIDが指定されていません");
    }

    // バリデーション
    this.validateEventData(eventData);
    // イベントの重複チェック（同じタイトルで同じ時間帯のイベントがないか）
    await this.checkEventConflict(groupId, eventData);

    return await this.eventRepository.create(groupId, eventData);
  }

  /* イベントを更新 */
  async updateEvent(
    groupId: string,
    eventData: Event,
  ): Promise<Event> {
    if (!groupId || groupId.trim() === "") {
      throw new Error("グループIDが指定されていません");
    }
    if (!eventData.id || eventData.id.trim() === "") {
      throw new Error("イベントIDが指定されていません");
    }

    // 既存のイベントが存在するかチェック
    const existingEvent = await this.eventRepository.findById(
      groupId,
      eventData.id,
    );
    if (!existingEvent) {
      throw new Error("更新対象のイベントが見つかりません");
    }

    // 更新データのバリデーション
    const updateData = {
      title: eventData.title ?? existingEvent.title,
      description: eventData.description ?? existingEvent.description,
      begin_at: eventData.begin_at ?? existingEvent.begin_at,
      end_at: eventData.end_at ?? existingEvent.end_at,
    };
    this.validateEventData(updateData);

    // イベントの重複チェック（自分以外で同じタイトル・時間帯のイベントがないか）
    await this.checkEventConflict(groupId, updateData, eventData.id);

    return await this.eventRepository.update(groupId, eventData);
  }

  /* イベントを削除 */
  async deleteEvent(groupId: string, eventId: string): Promise<void> {
    if (!groupId || groupId.trim() === "") {
      throw new Error("グループIDが指定されていません");
    }
    if (!eventId || eventId.trim() === "") {
      throw new Error("イベントIDが指定されていません");
    }

    // 既存のイベントが存在するかチェック
    const existingEvent = await this.eventRepository.findById(groupId, eventId);
    if (!existingEvent) {
      throw new Error("削除対象のイベントが見つかりません");
    }

    await this.eventRepository.delete(groupId, eventId);
  }

  /* イベントデータのバリデーション */
  private validateEventData(eventData: Event): void {
    if (!eventData.title || eventData.title.trim() === "") {
      throw new Error("イベントタイトルは必須です");
    }
    if (eventData.title.length > 100) {
      throw new Error("イベントタイトルは100文字以内で入力してください");
    }
    if (!eventData.description || eventData.description.trim() === "") {
      throw new Error("イベント説明は必須です");
    }
    if (eventData.description.length > 1000) {
      throw new Error("イベント説明は1000文字以内で入力してください");
    }
    if (!eventData.begin_at) {
      throw new Error("開始日時は必須です");
    }
    if (!eventData.end_at) {
      throw new Error("終了日時は必須です");
    }
    // 開始日時が終了日時より後でないかチェック
    if (eventData.begin_at.toDate() >= eventData.end_at.toDate()) {
      throw new Error("開始日時は終了日時より前である必要があります");
    }

    // 過去の日時でないかチェック（開始日時が現在時刻より前でないか）
    const now = new Date();
    if (eventData.begin_at.toDate() < now) {
      throw new Error("開始日時は現在時刻より後である必要があります");
    }
  }

  /* イベントの重複チェック */
  private async checkEventConflict(
    groupId: string,
    eventData: Event,
    excludeId?: string,
  ): Promise<void> {
    const allEvents = await this.eventRepository.findAll(groupId);

    const conflictingEvent = allEvents.find((event) => {
      // 自分自身は除外
      if (excludeId && event.id === excludeId) {
        return false;
      }

      // 同じタイトルで時間が重複しているかチェック
      const eventStart = eventData.begin_at.toDate();
      const eventEnd = eventData.end_at.toDate();
      const existingStart = event.begin_at.toDate();
      const existingEnd = event.end_at.toDate();

      return (
        event.title === eventData.title &&
        eventStart < existingEnd &&
        eventEnd > existingStart
      );
    });

    if (conflictingEvent) {
      throw new Error("同じタイトルで時間が重複するイベントが既に存在します");
    }
  }
}
