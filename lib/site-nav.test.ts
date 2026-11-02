import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isSiteNavActive, shouldCloseMenuOnPath, siteNavLinks } from "./site-nav";

describe("site navigation helpers", () => {
  it("keeps the existing public destinations", () => {
    assert.deepEqual(
      siteNavLinks.map((link) => link.href),
      ["/rings", "/pendants-chains", "/cuffs-bracelets", "/custom"],
    );
  });

  it("marks category destinations as current", () => {
    assert.equal(isSiteNavActive("/rings", "/rings"), true);
    assert.equal(isSiteNavActive("/custom", "/rings"), false);
    assert.equal(isSiteNavActive("/account", "/account"), true);
  });

  it("closes the menu only after a real route change", () => {
    assert.equal(shouldCloseMenuOnPath("/rings", null), false);
    assert.equal(shouldCloseMenuOnPath("/rings", "/rings"), false);
    assert.equal(shouldCloseMenuOnPath("/custom", "/rings"), true);
  });
});
