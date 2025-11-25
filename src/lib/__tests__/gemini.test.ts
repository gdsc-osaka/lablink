import { describe, it, expect } from 'vitest';
import { parseGeminiResponse } from '../gemini';

describe('parseGeminiResponse', () => {
    it('should parse valid JSON response without code blocks', () => {
        const text = `{
  "suggestions": [
    {
      "start": "2025-01-01T10:00:00.000Z",
      "end": "2025-01-01T12:00:00.000Z",
      "reason": "Tuesday at 19:00 is suitable for the event. All members are available."
    }
  ]
}`;

        const result = parseGeminiResponse(text);

        expect(result).toHaveLength(1);
        expect(result[0].start).toBe('2025-01-01T10:00:00.000Z');
        expect(result[0].end).toBe('2025-01-01T12:00:00.000Z');
        expect(result[0].reason).toBe('Tuesday at 19:00 is suitable for the event. All members are available.');
    });

    it('should parse JSON response with markdown code blocks', () => {
        const text = `\`\`\`json
{
  "suggestions": [
    {
      "start": "2025-01-01T10:00:00.000Z",
      "end": "2025-01-01T12:00:00.000Z",
      "reason": "Thursday at 14:00 is optimal for regular meetings."
    }
  ]
}
\`\`\``;

        const result = parseGeminiResponse(text);

        expect(result).toHaveLength(1);
        expect(result[0].start).toBe('2025-01-01T10:00:00.000Z');
        expect(result[0].end).toBe('2025-01-01T12:00:00.000Z');
        expect(result[0].reason).toBe('Thursday at 14:00 is optimal for regular meetings.');
    });

    it('should parse multiple suggestions (max 3)', () => {
        const text = `{
  "suggestions": [
    {
      "start": "2025-01-01T10:00:00.000Z",
      "end": "2025-01-01T12:00:00.000Z",
      "reason": "Suggestion 1"
    },
    {
      "start": "2025-01-02T14:00:00.000Z",
      "end": "2025-01-02T16:00:00.000Z",
      "reason": "Suggestion 2"
    },
    {
      "start": "2025-01-03T18:00:00.000Z",
      "end": "2025-01-03T20:00:00.000Z",
      "reason": "Suggestion 3"
    }
  ]
}`;

        const result = parseGeminiResponse(text);

        expect(result).toHaveLength(3);
        expect(result[0].reason).toBe('Suggestion 1');
        expect(result[1].reason).toBe('Suggestion 2');
        expect(result[2].reason).toBe('Suggestion 3');
    });

    it('should limit to maximum 3 suggestions', () => {
        const text = `{
  "suggestions": [
    {
      "start": "2025-01-01T10:00:00.000Z",
      "end": "2025-01-01T12:00:00.000Z",
      "reason": "Suggestion 1"
    },
    {
      "start": "2025-01-02T10:00:00.000Z",
      "end": "2025-01-02T12:00:00.000Z",
      "reason": "Suggestion 2"
    },
    {
      "start": "2025-01-03T10:00:00.000Z",
      "end": "2025-01-03T12:00:00.000Z",
      "reason": "Suggestion 3"
    },
    {
      "start": "2025-01-04T10:00:00.000Z",
      "end": "2025-01-04T12:00:00.000Z",
      "reason": "Suggestion 4"
    }
  ]
}`;

        const result = parseGeminiResponse(text);

        expect(result).toHaveLength(3);
    });

    it('should throw error for missing suggestions array', () => {
        const text = `{
  "data": []
}`;

        expect(() => parseGeminiResponse(text)).toThrow('Failed to parse Gemini response');
    });

    it('should throw error for non-array suggestions', () => {
        const text = `{
  "suggestions": "not an array"
}`;

        expect(() => parseGeminiResponse(text)).toThrow('Failed to parse Gemini response');
    });

    it('should throw error for invalid suggestion format (missing start)', () => {
        const text = `{
  "suggestions": [
    {
      "end": "2025-01-01T12:00:00.000Z",
      "reason": "Missing start"
    }
  ]
}`;

        expect(() => parseGeminiResponse(text)).toThrow('Failed to parse Gemini response');
    });

    it('should throw error for invalid suggestion format (missing end)', () => {
        const text = `{
  "suggestions": [
    {
      "start": "2025-01-01T10:00:00.000Z",
      "reason": "Missing end"
    }
  ]
}`;

        expect(() => parseGeminiResponse(text)).toThrow('Failed to parse Gemini response');
    });

    it('should throw error for invalid suggestion format (missing reason)', () => {
        const text = `{
  "suggestions": [
    {
      "start": "2025-01-01T10:00:00.000Z",
      "end": "2025-01-01T12:00:00.000Z"
    }
  ]
}`;

        expect(() => parseGeminiResponse(text)).toThrow('Failed to parse Gemini response');
    });

    it('should throw error for invalid JSON', () => {
        const text = `{
  "suggestions": [
    {
      "start": "2025-01-01T10:00:00.000Z",
      "end": "2025-01-01T12:00:00.000Z",
      "reason": "Invalid"
    }
  ]
  // Invalid JSON - missing closing brace
`;

        expect(() => parseGeminiResponse(text)).toThrow('Failed to parse Gemini response');
    });

    it('should handle extra whitespace and newlines', () => {
        const text = `


\`\`\`json

{
  "suggestions": [
    {
      "start": "2025-01-01T10:00:00.000Z",
      "end": "2025-01-01T12:00:00.000Z",
      "reason": "With whitespace"
    }
  ]
}

\`\`\`


`;

        const result = parseGeminiResponse(text);

        expect(result).toHaveLength(1);
        expect(result[0].start).toBe('2025-01-01T10:00:00.000Z');
    });
});
