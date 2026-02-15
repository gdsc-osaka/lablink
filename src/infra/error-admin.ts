import {
    DBError,
    NotFoundError,
    PermissionDeniedError,
    UnauthenticatedError,
    UnknownError,
} from "@/domain/error";
import { match } from "ts-pattern";

type AdminError = {
    code?: string;
    message?: string;
    stack?: string;
};

export const handleAdminError = (error: unknown): DBError => {
    const adminError = error as AdminError;
    if (adminError?.code) {
        return match(adminError.code)
            .with("not-found", () => NotFoundError)
            .with("permission-denied", () => PermissionDeniedError)
            .with("unauthenticated", () => UnauthenticatedError)
            .otherwise(() => UnknownError)(
            adminError.message ?? "Unknown error",
            {
                cause: error instanceof Error ? error : undefined,
                stack: adminError.stack,
            },
        );
    }

    return UnknownError(
        error instanceof Error ? error.message : "Unknown error",
        { cause: error instanceof Error ? error : undefined },
    );
};
