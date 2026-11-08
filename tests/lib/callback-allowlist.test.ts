import { describe, expect, it } from "vitest";
import { isAllowedCallback } from "../../src/lib/callback-allowlist";
import { SITE } from "../../src/config/site";

const d = SITE.rootDomain;

describe("isAllowedCallback", () => {
  it.each([
    [`https://${d}/auth/verify`, true],
    [`https://kurzy.${d}/auth/verify`, true],
    [`https://any.sub.${d}/x`, true],
    ["http://localhost:4321/auth/verify", true],
    ["http://localhost/foo", true],
    ["https://evil.com/auth", false],
    [`https://${d}.evil.com/x`, false],
    ["javascript:alert(1)", false],
    ["not-a-url", false],
    ["", false],
  ])("%s -> %s", (input, expected) => {
    expect(isAllowedCallback(input)).toBe(expected);
  });
});
