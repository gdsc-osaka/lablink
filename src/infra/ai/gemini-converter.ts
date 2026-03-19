import { ApiError, FinishReason } from "@google/genai";
import {
    GenAIError,
    GenAIUnauthenticatedError,
    GenAIPermissionDeniedError,
    GenAINotFoundError,
    GenAITooManyRequestsError,
    GenAIUnknownError,
    GenAISafetyError,
} from "@/domain/gen-ai";

export const GEMINI_IMPL = "gemini";

/** @see https://ai.google.dev/gemini-api/docs/troubleshooting */
export const toGenAIError = (error: ApiError, model: string): GenAIError => {
    switch (error.status) {
        case 401:
            return GenAIUnauthenticatedError(error.message, {
                extra: { impl: GEMINI_IMPL },
            });
        case 403:
            return GenAIPermissionDeniedError(error.message, {
                extra: { impl: GEMINI_IMPL, model },
            });
        case 404:
            return GenAINotFoundError(error.message, {
                extra: { impl: GEMINI_IMPL, model },
            });
        case 429:
            return GenAITooManyRequestsError(error.message, {
                extra: { impl: GEMINI_IMPL, model },
            });
        default:
            return GenAIUnknownError(error.message, {
                extra: { impl: GEMINI_IMPL, model },
            });
    }
};

export const finishReasonToGenAIError = (
    finishReason: FinishReason,
    model: string,
): GenAIError => {
    switch (finishReason) {
        case "SAFETY":
        case "RECITATION":
        case "BLOCKLIST":
        case "PROHIBITED_CONTENT":
        case "SPII":
        case "IMAGE_SAFETY":
        case "IMAGE_PROHIBITED_CONTENT":
            return GenAISafetyError(finishReason, {
                extra: { impl: GEMINI_IMPL, model },
            });
        default:
            return GenAIUnknownError(`Finish reason: ${finishReason}`, {
                extra: { impl: GEMINI_IMPL, model },
            });
    }
};
