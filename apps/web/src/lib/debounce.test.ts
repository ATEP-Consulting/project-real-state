import { afterEach, describe, expect, it, vi } from "vitest";
import { debounce } from "./debounce";

afterEach(() => vi.useRealTimers());

describe("debounce", () => {
  it("calls once with the last args after the wait", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const d = debounce(fn, 300);
    d(1);
    d(2);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(2);
  });
  it("cancel() prevents a pending call", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const d = debounce(fn, 300);
    d(1);
    d.cancel();
    vi.advanceTimersByTime(300);
    expect(fn).not.toHaveBeenCalled();
  });
});
