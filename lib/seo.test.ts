import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SITE_NAME, publicPageMetadata } from "./seo";

describe("public page metadata", () => {
  it("applies segment titles that compose with the root template", () => {
    const meta = publicPageMetadata({
      title: "Rings",
      description: "Sterling rings",
      path: "/rings",
    });
    assert.equal(meta.title, "Rings");
    assert.equal(meta.openGraph?.title, `Rings · ${SITE_NAME}`);
    assert.equal(meta.alternates?.canonical, "/rings");
  });

  it("keeps the home title absolute", () => {
    const meta = publicPageMetadata({
      title: SITE_NAME,
      description: "Home",
      path: "/",
      absolute: true,
    });
    assert.deepEqual(meta.title, { absolute: SITE_NAME });
    assert.equal(meta.robots?.index, true);
  });

  it("marks private flows as noindex", () => {
    const meta = publicPageMetadata({
      title: "Checkout",
      description: "Pay",
      path: "/checkout",
      index: false,
    });
    assert.equal(meta.robots?.index, false);
    assert.equal(meta.robots?.follow, false);
  });
});
