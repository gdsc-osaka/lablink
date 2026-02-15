/**
 * AI Suggest 機能のドメイン型定義
 */

import { EventTimeOfDay } from "./event";

/**
 * AI スケジュール提案のリクエスト
 */
export interface SuggestScheduleRequest {
    /** グループID */
    groupId: string;
    /** イベントの目的・説明 */
    description: string;
    /** 必須参加者のユーザーID一覧 */
    requiredMemberIds: string[];
    /** イベントの所要時間（分） */
    durationMinutes: number;
    /** 希望時間帯 */
    timeSlot: EventTimeOfDay;
    /** 検索対象期間 */
    dateRange: {
        /** 開始日時 (ISO 8601) */
        start: string;
        /** 終了日時 (ISO 8601) */
        end: string;
    };
}

/**
 * AI が提案する日程候補
 */
export interface ScheduleSuggestion {
    /** 開始日時 (ISO 8601) */
    start: string;
    /** 終了日時 (ISO 8601) */
    end: string;
    /** 提案理由（AIが生成） */
    reason: string;
}

/**
 * AI スケジュール提案のレスポンス
 */
export interface SuggestScheduleResponse {
    /** 成功フラグ */
    success: boolean;
    /** メッセージ */
    message?: string;
    /** 提案された日程候補（最大3件） */
    suggestions: ScheduleSuggestion[];
}

/**
 * メンバー情報（スコアリング用）
 */
export interface MemberInfo {
    /** ユーザーID */
    userId: string;
    /** メールアドレス */
    email: string;
    /** 必須参加者かどうか */
    isRequired: boolean;
}

/**
 * 30分スロット
 */
export interface TimeSlot {
    /** スロット開始時刻 (ISO 8601) */
    start: string;
    /** スロット終了時刻 (ISO 8601) */
    end: string;
    /** このスロットで参加可能なメンバー */
    availableMembers: string[];
    /** スコア（必須10点 + 任意1点） */
    score: number;
}

/**
 * スコア付き候補
 */
export interface ScoredCandidate {
    /** 開始日時 (ISO 8601) */
    start: string;
    /** 終了日時 (ISO 8601) */
    end: string;
    /** 合計スコア */
    totalScore: number;
    /** 参加可能な必須メンバー数 */
    requiredMemberCount: number;
    /** 参加可能な任意メンバー数 */
    optionalMemberCount: number;
}
