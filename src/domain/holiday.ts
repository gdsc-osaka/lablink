import { ResultAsync } from "neverthrow";
import { CalendarError } from "./calendar";
import { TokenRepository } from "./token";

export interface Holiday {
    date: string;
    name: string;
}

export interface HolidayRepository {
    fetchJapaneseHolidays(
        userId: string,
        timeMin: Date,
        timeMax: Date,
        tokenRepository: TokenRepository,
    ): ResultAsync<Holiday[], CalendarError>;
}
