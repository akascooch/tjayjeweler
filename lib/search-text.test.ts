import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { literalContains, searchQuery } from "./search-text";

describe("search query", () => {
  it("reads the first value when a query parameter is repeated", () => {
    assert.equal(searchQuery(["  ring  ", "chain"]), "ring");
  });

  it("ignores missing and non-text values", () => {
    assert.equal(searchQuery(undefined), "");
    assert.equal(searchQuery(1), "");
    assert.equal(searchQuery("   "), "");
  });

  it("caps the length used for the request", () => {
    assert.equal(searchQuery("a".repeat(250)).length, 200);
  });

  it("escapes LIKE wildcards without changing the visible query", () => {
    assert.equal(literalContains("100%_\\"), "100\\%\\_\\\\");
  });
});
