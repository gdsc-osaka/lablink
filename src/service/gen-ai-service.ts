import { ResultAsync } from "neverthrow";
import { GenAIError, GenAIRepository } from "@/domain/gen-ai";
import * as z from "zod";

export interface GenAIService {
    /**
     * テキストを生成する
     * @param prompt プロンプト
     * @param retryCount リトライ回数
     * @returns 生成されたテキスト
     */
    generateText: (
        prompt: string,
        retryCount?: number,
    ) => ResultAsync<string, GenAIError>;

    /**
     * 構造化データを生成する
     * @param prompt プロンプト
     * @param schema スキーマ
     * @param retryCount リトライ回数
     * @returns 生成された構造化データ
     */
    generateStructured: <T>(
        prompt: string,
        schema: z.ZodType<T>,
        retryCount?: number,
    ) => ResultAsync<T, GenAIError>;
}

export const createGenAIService = (
    genAIRepository: GenAIRepository,
): GenAIService => ({
    generateText: (prompt, retryCount = 0) => {
        const attempt = (remaining: number): ResultAsync<string, GenAIError> =>
            genAIRepository
                .generateText(prompt)
                .orElse((error) =>
                    remaining > 0
                        ? attempt(remaining - 1)
                        : ResultAsync.fromPromise(
                              Promise.reject(error),
                              () => error,
                          ),
                );
        return attempt(retryCount);
    },

    generateStructured: <T>(
        prompt: string,
        schema: z.ZodType<T>,
        retryCount = 0,
    ) => {
        const attempt = (remaining: number): ResultAsync<T, GenAIError> =>
            genAIRepository
                .generateStructured(prompt, schema)
                .orElse((error) =>
                    remaining > 0
                        ? attempt(remaining - 1)
                        : ResultAsync.fromPromise(
                              Promise.reject(error),
                              () => error,
                          ),
                );
        return attempt(retryCount);
    },
});
