import { test } from "node:test";
import assert from "node:assert/strict";
import type { NextApiRequest } from "next";
import { getClientIp, normalizeIpKey } from "../lib/rate-limit.ts";

function reqWithHeaders(
  headers: Record<string, string | string[]>
): NextApiRequest {
  return { headers } as unknown as NextApiRequest;
}

test("getClientIp takes the first x-forwarded-for entry", () => {
  assert.equal(
    getClientIp(reqWithHeaders({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" })),
    "203.0.113.7"
  );
});

test("getClientIp accepts an array header", () => {
  assert.equal(
    getClientIp(reqWithHeaders({ "x-forwarded-for": ["198.51.100.4"] })),
    "198.51.100.4"
  );
});

test("getClientIp returns an empty string when the header is absent", () => {
  assert.equal(getClientIp(reqWithHeaders({})), "");
});

// Mirrors ipaddress.ip_network(f"{ip}/64", strict=False).network_address:
// an IPv6 address collapses to its /64 network address, so one client can't
// mint fresh buckets by rotating addresses within the /64 its ISP assigned.
const IPV6_CASES: Array<[string, string]> = [
  // Full form collapses to the /64 network address.
  ["2001:db8:abcd:ef01:1234:5678:9abc:def0", "2001:db8:abcd:ef01::"],
  // Compressed input in the same /64 gives the same key.
  ["2001:db8:abcd:ef01::1", "2001:db8:abcd:ef01::"],
  // Uppercase is canonicalized to lowercase.
  ["2001:DB8:ABCD:EF01:1234:5678:9ABC:DEF0", "2001:db8:abcd:ef01::"],
  // Leading zeros are stripped, like Python's str(IPv6Address).
  ["2001:0db8:0000:0001:0000:0000:0000:0001", "2001:db8:0:1::"],
  // A different /64 is a different bucket.
  ["2001:db8:abcd:ef02::1", "2001:db8:abcd:ef02::"],
  // Loopback and friends share the all-zero /64.
  ["::1", "::"],
  ["fe80::1", "fe80::"],
  // IPv4 stays per-address.
  ["203.0.113.7", "203.0.113.7"],
  // IPv4-mapped IPv6 is treated as the IPv4 address (not collapsed into
  // the shared ::/64, which would merge every mapped client into one bucket).
  ["::ffff:203.0.113.7", "203.0.113.7"],
  // IPv4-embedded tail expands before the /64 collapse.
  ["2001:db8::203.0.113.7", "2001:db8::"],
  // Unrecognized values are used as-is (one bounded bucket per value).
  ["not-an-ip", "not-an-ip"],
  ["", ""],
];

for (const [input, expected] of IPV6_CASES) {
  test(`normalizeIpKey(${JSON.stringify(input)}) -> ${JSON.stringify(expected)}`, () => {
    assert.equal(normalizeIpKey(input), expected);
  });
}
