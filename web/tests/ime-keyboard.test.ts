import { describe, expect, it } from "vitest";

import { isImeComposing, isPlainEnterKey } from "../src/lib/keyboard-event";

type KeyboardEventLike = Parameters<typeof isPlainEnterKey>[0];

function enterEvent(overrides: Partial<KeyboardEventLike> = {}): KeyboardEventLike {
    return {
        key: "Enter",
        shiftKey: false,
        ctrlKey: false,
        metaKey: false,
        ...overrides,
    };
}

describe("keyboard event", () => {
    it("只让没有修饰键的 Enter 提交", () => {
        expect(isPlainEnterKey(enterEvent())).toBe(true);
        expect(isPlainEnterKey(enterEvent({ shiftKey: true }))).toBe(false);
        expect(isPlainEnterKey(enterEvent({ ctrlKey: true }))).toBe(false);
        expect(isPlainEnterKey(enterEvent({ metaKey: true }))).toBe(false);
        expect(isPlainEnterKey(enterEvent({ key: "a" }))).toBe(false);
    });

    it("输入法正在组词时不提交", () => {
        expect(isPlainEnterKey(enterEvent({ nativeEvent: { isComposing: true } }))).toBe(false);
        expect(isPlainEnterKey(enterEvent({ nativeEvent: { keyCode: 229 } }))).toBe(false);
    });

    it("识别浏览器和旧版输入法组合标记", () => {
        expect(isImeComposing(enterEvent({ isComposing: true }))).toBe(true);
        expect(isImeComposing(enterEvent({ nativeEvent: { isComposing: true } }))).toBe(true);
        expect(isImeComposing(enterEvent({ keyCode: 229 }))).toBe(true);
        expect(isImeComposing(enterEvent({ nativeEvent: { keyCode: 229 } }))).toBe(true);
        expect(isImeComposing(enterEvent())).toBe(false);
    });
});
