import { ResultAsync } from "neverthrow";
import * as z from "zod";
import { errorBuilder, InferError } from "obj-err";

export const GenAIUnauthenticatedError = errorBuilder(
    "GenAIUnauthenticatedError",
    z.object({
        impl: z.string(),
    }),
);
export type GenAIUnauthenticatedError = InferError<
    typeof GenAIUnauthenticatedError
>;

export const GenAIPermissionDeniedError = errorBuilder(
    "GenAIPermissionDeniedError",
    z.object({
        impl: z.string(),
        model: z.string(),
    }),
);
export type GenAIPermissionDeniedError = InferError<
    typeof GenAIPermissionDeniedError
>;

export const GenAINotFoundError = errorBuilder(
    "GenAINotFoundError",
    z.object({
        impl: z.string(),
        model: z.string(),
    }),
);
export type GenAINotFoundError = InferError<typeof GenAINotFoundError>;

export const GenAITooManyRequestsError = errorBuilder(
    "GenAITooManyRequestsError",
    z.object({
        impl: z.string(),
        model: z.string(),
    }),
);
export type GenAITooManyRequestsError = InferError<
    typeof GenAITooManyRequestsError
>;

export const GenAISafetyError = errorBuilder(
    "GenAISafetyError",
    z.object({
        impl: z.string(),
        model: z.string(),
    }),
);
export type GenAISafetyError = InferError<typeof GenAISafetyError>;

export const GenAIUnknownError = errorBuilder(
    "GenAIUnknownError",
    z.object({
        impl: z.string(),
        model: z.string().optional(),
        validationErrors: z.array(z.unknown()).optional(),
    }),
);
export type GenAIUnknownError = InferError<typeof GenAIUnknownError>;

export type GenAIError =
    | GenAIUnauthenticatedError
    | GenAIPermissionDeniedError
    | GenAINotFoundError
    | GenAITooManyRequestsError
    | GenAISafetyError
    | GenAIUnknownError;

export interface GenAIRepository {
    /**
     * テキストを生成する
     * @param prompt プロンプト
     * @returns 生成されたテキスト
     */
    generateText: (prompt: string) => ResultAsync<string, GenAIError>;

    /**
     * 構造化データを生成する
     * @param prompt プロンプト
     * @param schema スキーマ
     * @returns 生成された構造化データ
     */
    generateStructured: <T>(
        prompt: string,
        schema: z.ZodType<T>,
    ) => ResultAsync<T, GenAIError>;
}
