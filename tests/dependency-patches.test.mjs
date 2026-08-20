import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const vinextRequire = createRequire(import.meta.resolve("vinext"));
const { ICNS } = vinextRequire("image-size/types/icns");
const { JXL } = vinextRequire("image-size/types/jxl");
const { HEIF } = vinextRequire("image-size/types/heif");
const encoder = new TextEncoder();

const writeBox = (input, offset, size, name) => {
  new DataView(input.buffer).setUint32(offset, size, false);
  input.set(encoder.encode(name), offset + 4);
};

test("patched ICNS parser rejects a zero-length entry", () => {
  const input = new Uint8Array(16);
  input.set(encoder.encode("icns"), 0);
  new DataView(input.buffer).setUint32(4, input.length, false);
  input.set(encoder.encode("ic07"), 8);

  assert.throws(() => ICNS.calculate(input), /Invalid ICNS entry length/);
});

test("patched JXL parser rejects a zero-length partial stream box", () => {
  const input = new Uint8Array(12);
  writeBox(input, 0, 0, "jxlp");

  assert.throws(() => JXL.calculate(input), /Invalid JXL box size/);
});

test("patched HEIF parser rejects a zero-length property box", () => {
  const input = new Uint8Array(48);
  writeBox(input, 0, 48, "meta");
  writeBox(input, 12, 36, "iprp");
  writeBox(input, 20, 28, "ipco");
  writeBox(input, 28, 0, "ispe");

  assert.throws(() => HEIF.calculate(input), /Invalid HEIF box size/);
});
