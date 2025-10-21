import { getCommonAvailability } from "../../app/actions";
import { formatInTimeZone } from "date-fns-tz";

const JST = "Asia/Tokyo";

// Google Calendar APIのモック
const mockCalendarQuery = vi.fn();
const mockCalendar = {
    freebusy: {
        query: mockCalendarQuery,
    },
};
const mockOAuth2 = {
    setCredentials: vi.fn(),
};

vi.mock("googleapis", () => ({
    google: {
        auth: {
            OAuth2: vi.fn(() => mockOAuth2),
        },
        calendar: vi.fn(() => mockCalendar),
    },
}));

describe("Calendar API Integration", () => {
    const mockAccessToken = "mock-access-token";
    const mockUserEmails = ["user1@example.com", "user2@example.com"];
    const mockTimeMin = "2024-01-01T09:00:00Z";
    const mockTimeMax = "2024-01-01T17:00:00Z";

    beforeEach(() => {
        vi.clearAllMocks();
        mockCalendarQuery.mockReset();
    });

    it("アクセストークンがない場合、エラーを投げる", async () => {
        await expect(
            getCommonAvailability("", mockUserEmails, mockTimeMin, mockTimeMax),
        ).rejects.toThrow("Access token is required.");
    });

    it("Google Calendar APIから正常にデータを取得できる", async () => {
        const mockCalendarResponse = {
            data: {
                calendars: {
                    "user1@example.com": {
                        busy: [
                            {
                                start: "2024-01-01T18:00:00Z",
                                end: "2024-01-01T19:00:00Z",
                            },
                        ],
                    },
                    "user2@example.com": {
                        busy: [
                            {
                                start: "2024-01-01T21:00:00Z",
                                end: "2024-01-01T23:00:00Z",
                            },
                        ],
                    },
                },
            },
        };

        mockCalendarQuery.mockResolvedValue(mockCalendarResponse);

        const result = await getCommonAvailability(
            mockAccessToken,
            mockUserEmails,
            mockTimeMin,
            mockTimeMax,
        );

        const expectedStartTime = formatInTimeZone(new Date(mockTimeMin), JST, 'HH:mm'); // "18:00"
        const expectedEndTime = formatInTimeZone(new Date(mockTimeMax), JST, 'HH:mm');   // "02:00"
        const expectedFreeSlot = `${expectedStartTime} から ${expectedEndTime} まで`;

        expect(result.success).toBe(true);
        expect(result.data).toContain("利用可能な共通の空き時間帯リスト:");
        expect(result.data).toContain(expectedFreeSlot); // 動的に生成した期待値で検証
    });

    it("カレンダーに予定がない場合、適切なメッセージを返す", async () => {
        const mockCalendarResponse = {
            data: {
                calendars: {
                    "user1@example.com": { busy: [] },
                    "user2@example.com": { busy: [] },
                },
            },
        };

        mockCalendarQuery.mockResolvedValue(mockCalendarResponse);

        const result = await getCommonAvailability(
            mockAccessToken,
            mockUserEmails,
            mockTimeMin,
            mockTimeMax,
        );

        const expectedStartTime = formatInTimeZone(new Date(mockTimeMin), JST, 'HH:mm'); // "18:00"
        const expectedEndTime = formatInTimeZone(new Date(mockTimeMax), JST, 'HH:mm');   // "02:00"
        const expectedFreeSlot = `${expectedStartTime} から ${expectedEndTime} まで`;

        expect(result.success).toBe(true);
        expect(result.data).toContain("利用可能な共通の空き時間帯リスト:");
        expect(result.data).toContain(expectedFreeSlot); // 動的に生成した期待値で検証
    });

    it("APIエラーが発生した場合、適切にエラーハンドリングされる", async () => {
        mockCalendarQuery.mockRejectedValue(new Error("API Error"));

        await expect(
            getCommonAvailability(
                mockAccessToken,
                mockUserEmails,
                mockTimeMin,
                mockTimeMax,
            ),
        ).rejects.toThrow(
            "An error occurred while processing calendar availability.",
        );
    });

    it("無効なbusyデータは適切にフィルタリングされる", async () => {
        const mockCalendarResponse = {
            data: {
                calendars: {
                    "user1@example.com": {
                        busy: [
                            {
                                start: "2024-01-01T10:00:00Z", // JST 19:00
                                end: "2024-01-01T12:00:00Z",   // JST 21:00
                            },
                            { start: null, end: "2024-01-01T13:00:00Z" }, // 無効なデータ
                            { start: "2024-01-01T14:00:00Z", end: null }, // 無効なデータ
                            {
                                start: "2024-01-01T15:00:00Z", // JST 00:00
                                end: "2024-01-01T16:00:00Z",   // JST 01:00
                            },
                        ],
                    },
                },
            },
        };

        mockCalendarQuery.mockResolvedValue(mockCalendarResponse);

        const result = await getCommonAvailability(
            mockAccessToken,
            ["user1@example.com"],
            mockTimeMin,
            mockTimeMax,
        );

        // 複雑なケースでも、UTCの入力値から期待されるJSTの空き時間文字列を正確に生成します
        const rangeStart = formatInTimeZone(new Date(mockTimeMin), JST, 'HH:mm'); // 18:00
        const busy1Start = formatInTimeZone(new Date("2024-01-01T10:00:00Z"), JST, 'HH:mm'); // 19:00
        const busy1End = formatInTimeZone(new Date("2024-01-01T12:00:00Z"), JST, 'HH:mm');   // 21:00
        const busy2Start = formatInTimeZone(new Date("2024-01-01T15:00:00Z"), JST, 'HH:mm'); // 00:00
        const busy2End = formatInTimeZone(new Date("2024-01-01T16:00:00Z"), JST, 'HH:mm');   // 01:00
        const rangeEnd = formatInTimeZone(new Date(mockTimeMax), JST, 'HH:mm');     // 02:00

        const expectedSlot1 = `${rangeStart} から ${busy1Start} まで`; // 18:00 -> 19:00
        const expectedSlot2 = `${busy1End} から ${busy2Start} まで`;   // 21:00 -> 00:00
        const expectedSlot3 = `${busy2End} から ${rangeEnd} まで`;     // 01:00 -> 02:00

        expect(result.success).toBe(true);
        expect(result.data).toContain(expectedSlot1);
        expect(result.data).toContain(expectedSlot2);
        expect(result.data).toContain(expectedSlot3);
    });

    it("calendarsBusyInfoがnullの場合の処理", async () => {
        const mockCalendarResponse = {
            data: {
                calendars: null, // calendarsBusyInfoがnullの場合
            },
        };

        mockCalendarQuery.mockResolvedValue(mockCalendarResponse);

        const result = await getCommonAvailability(
            mockAccessToken,
            ["user1@example.com"],
            mockTimeMin,
            mockTimeMax,
        );

        expect(result.data).toBe(
            "利用可能な共通の空き時間帯はありませんでした。",
        );
    });
});
