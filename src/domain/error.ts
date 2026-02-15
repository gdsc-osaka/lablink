import { errorBuilder, InferError } from "obj-err";
import { z } from "zod";

export const NotFoundError = errorBuilder("NotFoundError");
type NotFoundError = InferError<typeof NotFoundError>;

export const PermissionDeniedError = errorBuilder("PermissionDeniedError");
type PermissionDeniedError = InferError<typeof PermissionDeniedError>;

export const UnauthenticatedError = errorBuilder("UnauthenticatedError");
type UnauthenticatedError = InferError<typeof UnauthenticatedError>;

// その他のエラー
export const UnknownError = errorBuilder("UnknownError");
type UnknownError = InferError<typeof UnknownError>;

// 招待関連エラー
export const ExpiredError = errorBuilder("ExpiredError");
type ExpiredError = InferError<typeof ExpiredError>;

export type DBError =
    | NotFoundError
    | PermissionDeniedError
    | UnauthenticatedError
    | UnknownError;

export const ServiceLogicExtraSchema = z.object({
    code: z.string(),
});

export const ServiceLogicError = errorBuilder<
    string,
    typeof ServiceLogicExtraSchema
>("ServiceLogicError");
type ServiceLogicError = InferError<typeof ServiceLogicError>;

export type ServiceError = DBError | ServiceLogicError;

export type InvitationError = DBError | ExpiredError;
