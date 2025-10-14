import { FirestoreError } from "firebase/firestore";
import {
    DBError,
    NotFoundError,
    PermissionDeniedError,
    UnauthenticatedError,
    UnknownError,
} from "@/domain/error";
import { match } from "ts-pattern";

/**
 * FirestoreのエラーをDBErrorに変換する
 * @param error FirestoreError
 * @returns DBError
 */
export const handleFirestoreError = (error: unknown): DBError =>
    error instanceof FirestoreError
        ? match(error.code)
              .with("not-found", () => NotFoundError)
              .with("permission-denied", () => PermissionDeniedError)
              .with("unauthenticated", () => UnauthenticatedError)
              .otherwise(() => UnknownError)(error.message, {
              // match() が関数を返し, () で call する
              extra: {
                  cause: error,
                  stack: error.stack,
              },
          })
        : UnknownError(
              error instanceof Error ? error.message : "Unknown error",
              {
                  extra: {},
                  cause: error instanceof Error ? error : undefined,
              },
          );
