/**
 * Tests for netlify/functions/clanker-report.js
 *
 * A public endpoint that turns a flagged terminal-AI answer into a GitHub
 * issue. It takes untrusted input and talks to the GitHub API, so the contract
 * worth guarding is the handler's branching (method/honeypot/empty/no-token,
 * report vs miss, miss dedupe) and that input is clamped into the issue it
 * files. `fetch` is mocked so nothing leaves the process.
 */

const { handler } = require("../clanker-report.js");

// A GitHub API response double. `items` drives the miss-dedupe search.
function ghResponse({ ok = true, items } = {}) {
  return {
    ok,
    json: () => Promise.resolve(items === undefined ? {} : { items }),
  };
}

function event(body, httpMethod = "POST") {
  return {
    httpMethod,
    body: typeof body === "string" ? body : JSON.stringify(body),
  };
}

// The POST /issues call across fetch invocations (report + miss both create).
function createIssueCall() {
  return global.fetch.mock.calls.find(
    ([url, opts]) => /\/issues$/.test(url) && opts && opts.method === "POST"
  );
}

describe("clanker-report handler", () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => Promise.resolve(ghResponse()));
    process.env.GITHUB_ISSUE_TOKEN = "test-token";
    delete process.env.GITHUB_REPO;
  });

  test("rejects non-POST with 405 and never calls GitHub", async () => {
    const res = await handler(event({ query: "hi" }, "GET"));
    expect(res.statusCode).toBe(405);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("malformed JSON body is swallowed as 200, no GitHub call", async () => {
    const res = await handler(event("{not json", "POST"));
    expect(res.statusCode).toBe(200);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("honeypot submissions are dropped silently", async () => {
    const res = await handler(event({ query: "hi", bot_field: "gotcha" }));
    expect(res.statusCode).toBe(200);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("empty query is a no-op", async () => {
    const res = await handler(event({ query: "   " }));
    expect(res.statusCode).toBe(200);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("missing token returns 500 not_configured", async () => {
    delete process.env.GITHUB_ISSUE_TOKEN;
    const res = await handler(event({ query: "hi" }));
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toBe("not_configured");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // Origin gate: a browser sets the Origin/Referer it cannot forge, so an
  // off-site page's cross-origin POST is rejected before any GitHub quota is
  // spent. A too-wide suffix match (`*.netlify.app`) would let any
  // attacker-controlled Netlify site through — this is that regression's guard.
  describe("origin allowlist", () => {
    function eventFrom(origin, payload = { type: "report", query: "hi" }) {
      return { ...event(payload), headers: { origin } };
    }

    test("a foreign *.netlify.app host is rejected (no GitHub call)", async () => {
      const res = await handler(eventFrom("https://attacker.netlify.app"));
      expect(res.statusCode).toBe(200);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test("an arbitrary off-site origin is rejected", async () => {
      const res = await handler(eventFrom("https://evil.example.com"));
      expect(res.statusCode).toBe(200);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test("this site's deploy-preview host is allowed", async () => {
      const res = await handler(
        eventFrom("https://deploy-preview-5--tor-bjorn.netlify.app")
      );
      expect(res.statusCode).toBe(200);
      expect(createIssueCall()).toBeTruthy();
    });

    test("the production origin is allowed", async () => {
      const res = await handler(eventFrom("https://www.tor-bjorn.com"));
      expect(res.statusCode).toBe(200);
      expect(createIssueCall()).toBeTruthy();
    });

    test("a same-site Referer is honored when Origin is absent", async () => {
      const res = await handler({
        ...event({ type: "report", query: "hi" }),
        headers: { referer: "https://tor-bjorn.com/terminal/" },
      });
      expect(res.statusCode).toBe(200);
      expect(createIssueCall()).toBeTruthy();
    });

    test("a request with no Origin or Referer is allowed (privacy tooling)", async () => {
      const res = await handler(event({ type: "report", query: "hi" }));
      expect(res.statusCode).toBe(200);
      expect(createIssueCall()).toBeTruthy();
    });
  });

  describe("type: report", () => {
    test("opens a clanker-report issue with the clamped query as title", async () => {
      const res = await handler(
        event({ type: "report", query: "why is this wrong", answer: "because" })
      );
      expect(res.statusCode).toBe(200);

      const call = createIssueCall();
      expect(call).toBeTruthy();
      const [url, opts] = call;
      expect(url).toContain("/repos/tor2dbear/portfolio/issues");
      const sent = JSON.parse(opts.body);
      expect(sent.title).toBe('clanker: "why is this wrong"');
      expect(sent.labels).toEqual(["clanker-report"]);
      expect(sent.body).toContain("**Query:** why is this wrong");
      expect(sent.body).toContain("**Answer:** because");
    });

    test("collapses whitespace and caps the query length in the title", async () => {
      const query = "a\n\t  b   c" + " x".repeat(200);
      await handler(event({ type: "report", query }));
      const sent = JSON.parse(createIssueCall()[1].body);
      const title = sent.title;
      // Title is `clanker: "<clamped>"` — clamp collapses runs of whitespace
      // to single spaces and caps at 200 chars.
      const clamped = title.slice('clanker: "'.length, -1);
      expect(clamped).toMatch(/^a b c/);
      expect(clamped).not.toMatch(/\s{2,}/);
      expect(clamped.length).toBeLessThanOrEqual(200);
    });

    test("honours the GITHUB_REPO override", async () => {
      process.env.GITHUB_REPO = "someone/else";
      await handler(event({ type: "report", query: "hi" }));
      expect(createIssueCall()[0]).toContain("/repos/someone/else/issues");
    });
  });

  describe("type: miss (dedupe)", () => {
    test("no existing issue → searches then creates a clanker-miss issue", async () => {
      global.fetch = jest.fn((url) =>
        Promise.resolve(
          /\/search\/issues/.test(url)
            ? ghResponse({ items: [] })
            : ghResponse()
        )
      );

      const res = await handler(event({ type: "miss", query: "unmatched q" }));
      expect(res.statusCode).toBe(200);

      const searched = global.fetch.mock.calls.some(([u]) =>
        /\/search\/issues/.test(u)
      );
      expect(searched).toBe(true);

      const created = createIssueCall();
      expect(created).toBeTruthy();
      const sent = JSON.parse(created[1].body);
      expect(sent.title).toBe("clanker miss: unmatched q");
      expect(sent.labels).toEqual(["clanker-miss"]);
    });

    test("existing issue with the same title → reacts, does not create", async () => {
      const title = "clanker miss: unmatched q";
      global.fetch = jest.fn((url) => {
        if (/\/search\/issues/.test(url)) {
          return Promise.resolve(
            ghResponse({ items: [{ title, number: 42 }] })
          );
        }
        return Promise.resolve(ghResponse());
      });

      const res = await handler(event({ type: "miss", query: "unmatched q" }));
      expect(res.statusCode).toBe(200);

      const reacted = global.fetch.mock.calls.some(([u]) =>
        /\/issues\/42\/reactions$/.test(u)
      );
      expect(reacted).toBe(true);
      expect(createIssueCall()).toBeUndefined();
    });

    test("unknown type falls through to miss handling", async () => {
      global.fetch = jest.fn((url) =>
        Promise.resolve(
          /\/search\/issues/.test(url)
            ? ghResponse({ items: [] })
            : ghResponse()
        )
      );
      await handler(event({ type: "bogus", query: "q" }));
      const sent = JSON.parse(createIssueCall()[1].body);
      expect(sent.labels).toEqual(["clanker-miss"]);
    });
  });

  test("a GitHub API failure never surfaces to the visitor", async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error("network down")));
    const res = await handler(event({ type: "report", query: "hi" }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ ok: false });
  });
});
