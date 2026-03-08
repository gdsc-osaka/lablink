import {
    GenAIError,
    GenAIRepository,
    GenAIUnknownError,
} from "@/domain/gen-ai";
import { err, ok, Result, ResultAsync } from "neverthrow";
import { ApiError, GoogleGenAI } from "@google/genai";
import * as z from "zod";
import { finishReasonToGenAIError, toGenAIError } from "./gemini-converter";

export const GEMINI_IMPL = "gemini";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    throw new Error(
        "GEMINI_API_KEY environment variable is not set. " +
            "Google Gemini client cannot be initialized. " +
            "Please configure GEMINI_API_KEY in your environment.",
    );
}

const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
});

const GEMINI_MODEL_NAME = "gemini-3-flash-preview";

export const geminiRepo: GenAIRepository = {
    generateText: (prompt) =>
        ResultAsync.fromPromise(
            ai.models.generateContent({
                model: GEMINI_MODEL_NAME,
                contents: prompt,
            }),
            (error) => {
                const _error = error as ApiError;
                return toGenAIError(_error, GEMINI_MODEL_NAME);
            },
        ).andThen((response) => {
            if (!response.text) {
                const finishReason = response.candidates?.[0].finishReason;
                if (!finishReason) {
                    return err(
                        GenAIUnknownError("No text in response", {
                            extra: {
                                impl: GEMINI_IMPL,
                                model: GEMINI_MODEL_NAME,
                            },
                        }),
                    );
                }

                return err(
                    finishReasonToGenAIError(finishReason, GEMINI_MODEL_NAME),
                );
            }

            return ok(response.text);
        }),

    generateStructured: <T extends z.ZodType>(
        prompt: string,
        schema: T,
    ): ResultAsync<z.infer<T>, GenAIError> =>
        ResultAsync.fromPromise(
            ai.models.generateContent({
                model: GEMINI_MODEL_NAME,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema.toJSONSchema(),
                },
            }),
            (error) => {
                const _error = error as ApiError;
                return toGenAIError(_error, GEMINI_MODEL_NAME);
            },
        ).andThen((response): Result<z.infer<T>, GenAIError> => {
            if (!response.text) {
                const finishReason = response.candidates?.[0].finishReason;
                if (!finishReason) {
                    return err(
                        GenAIUnknownError("No text in response", {
                            extra: {
                                impl: GEMINI_IMPL,
                                model: GEMINI_MODEL_NAME,
                            },
                        }),
                    );
                }

                return err(
                    finishReasonToGenAIError(finishReason, GEMINI_MODEL_NAME),
                );
            }

            return Result.fromThrowable(JSON.parse, (): GenAIError => {
                return GenAIUnknownError("Invalid response", {
                    extra: { impl: GEMINI_IMPL, model: GEMINI_MODEL_NAME },
                });
            })(response.text).andThen(
                (parsedJson): Result<z.infer<T>, GenAIError> => {
                    const parsedResult = schema.safeParse(parsedJson);
                    if (!parsedResult.success) {
                        return err(
                            GenAIUnknownError("Invalid response", {
                                extra: {
                                    impl: GEMINI_IMPL,
                                    model: GEMINI_MODEL_NAME,
                                },
                            }),
                        );
                    }

                    return ok(parsedResult.data);
                },
            );
        }),
};
