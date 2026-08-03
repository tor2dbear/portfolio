/**
 * clanker-report — turn a flagged assistant answer into a GitHub issue.
 *
 * The terminal `ai` assistant (terminal-ai.js) POSTs here when a visitor reports
 * a bad reply (type "report") or when an unmatched question falls through to the
 * fallback (type "miss", auto-logged and deduped per session client-side). Each
 * becomes an actionable issue in the repo so the intent data can be improved:
 *   - report → a `clanker-report` issue (a human said this answer was wrong)
 *   - miss   → a `clanker-miss` issue, deduped by title; a repeat just adds a
 *              👍 reaction to the existing one instead of opening a new issue.
 *
 * Setup (one-time, on Netlify): a fine-grained PAT with Issues: read/write on
 * the repo, as env var GITHUB_ISSUE_TOKEN, plus GITHUB_REPO ("owner/name",
 * defaults to tor2dbear/portfolio). Without the token the function no-ops 500.
 *
 * Abuse: it's a public endpoint that opens issues, so — a honeypot field, hard
 * length caps, and the miss dedupe (repeat spam collapses onto one issue).
 */
const GITHUB_API = "https://api.github.com";

// Only accept requests that a browser made from one of the site's own origins.
// A cross-site page doing fetch() to this endpoint always sends an Origin the
// browser sets (it cannot forge it), so an off-site origin is rejected. Legit
// same-origin POSTs send Origin and/or Referer; when neither is present (some
// privacy tooling strips both) we allow, to avoid blocking real visitors — this
// gate is about stopping drive-by browser abuse, not replacing rate limiting.
function originAllowed(event) {
  var h = event.headers || {};
  var src = h.origin || h.Origin || h.referer || h.Referer || "";
  if (!src) {
    return true;
  }
  try {
    var host = new URL(src).hostname;
    return (
      host === "www.tor-bjorn.com" ||
      host === "tor-bjorn.com" ||
      host === "localhost" ||
      host === "127.0.0.1" ||
      // Only THIS site's Netlify hosts — the production subdomain and its
      // deploy-preview/branch-deploy hosts (deploy-preview-N--tor-bjorn.netlify.app,
      // <branch>--tor-bjorn.netlify.app). A bare ".netlify.app" suffix would let
      // any attacker-controlled Netlify site through.
      host === "tor-bjorn.netlify.app" ||
      host.endsWith("--tor-bjorn.netlify.app")
    );
  } catch (e) {
    return false;
  }
}

function ok(body) {
  return { statusCode: 200, body: JSON.stringify(body || { ok: true }) };
}

function ghHeaders(token) {
  return {
    Authorization: "Bearer " + token,
    Accept: "application/vnd.github+json",
    "User-Agent": "clanker-report",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

function clamp(value, max) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

// Build the issue body — the query, the answer, the classification, and the
// recent turns — as markdown so it's readable and actionable in the tracker.
function issueBody(payload) {
  var lines = [];
  lines.push("**Query:** " + clamp(payload.query, 200));
  if (payload.answer) {
    lines.push("**Answer:** " + clamp(payload.answer, 500));
  }
  if (payload.note) {
    lines.push("**Note:** " + clamp(payload.note, 500));
  }
  lines.push("");
  lines.push("- kind: `" + clamp(payload.kind || "fallback", 20) + "`");
  lines.push("- intent: `" + clamp(payload.intent || "—", 60) + "`");
  if (payload.entity) {
    lines.push("- entity: `" + clamp(payload.entity, 60) + "`");
  }
  lines.push("- score: `" + clamp(payload.score, 12) + "`");
  lines.push("- lang: `" + clamp(payload.lang || "", 8) + "`");
  lines.push("- page: `" + clamp(payload.page || "", 120) + "`");
  if (Array.isArray(payload.context) && payload.context.length) {
    lines.push("");
    lines.push("Recent turns:");
    payload.context.slice(-12).forEach(function (turn) {
      lines.push("- (" + clamp(turn.kind, 20) + ") " + clamp(turn.q, 200));
    });
  }
  lines.push("");
  lines.push("<sub>filed by clanker-report</sub>");
  return lines.join("\n");
}

async function createIssue(repo, token, title, body, label) {
  return fetch(GITHUB_API + "/repos/" + repo + "/issues", {
    method: "POST",
    headers: ghHeaders(token),
    body: JSON.stringify({ title: title, body: body, labels: [label] }),
  });
}

// Find an OPEN issue with this exact title under the miss label, so a recurring
// unmatched question bumps one issue instead of spawning duplicates.
async function findOpenMiss(repo, token, title) {
  var q =
    "repo:" +
    repo +
    " is:issue is:open label:clanker-miss in:title " +
    JSON.stringify(title);
  var res = await fetch(
    GITHUB_API + "/search/issues?q=" + encodeURIComponent(q),
    { headers: ghHeaders(token) }
  );
  if (!res.ok) {
    return null;
  }
  var data = await res.json().catch(function () {
    return null;
  });
  if (!data || !Array.isArray(data.items)) {
    return null;
  }
  for (var i = 0; i < data.items.length; i++) {
    if (data.items[i].title === title) {
      return data.items[i].number;
    }
  }
  return null;
}

async function addReaction(repo, token, number) {
  return fetch(
    GITHUB_API + "/repos/" + repo + "/issues/" + number + "/reactions",
    {
      method: "POST",
      headers: ghHeaders(token),
      body: JSON.stringify({ content: "+1" }),
    }
  );
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Reject cross-site browser abuse silently (an ok() keeps the chat unbroken
  // and gives an off-site caller no signal), before spending any GitHub quota.
  if (!originAllowed(event)) {
    return ok();
  }

  var payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return ok();
  }

  // Honeypot — a bot that fills the hidden field is dropped silently.
  if (payload.bot_field) {
    return ok();
  }

  var query = clamp(payload.query, 200);
  if (!query) {
    return ok();
  }

  var token = process.env.GITHUB_ISSUE_TOKEN;
  var repo = process.env.GITHUB_REPO || "tor2dbear/portfolio";
  if (!token) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "not_configured" }),
    };
  }

  var type = payload.type === "report" ? "report" : "miss";
  var body = issueBody(payload);

  try {
    if (type === "report") {
      await createIssue(
        repo,
        token,
        'clanker: "' + query + '"',
        body,
        "clanker-report"
      );
      return ok();
    }

    // miss — dedupe by exact title.
    var title = "clanker miss: " + query;
    var existing = await findOpenMiss(repo, token, title);
    if (existing) {
      await addReaction(repo, token, existing);
    } else {
      await createIssue(repo, token, title, body, "clanker-miss");
    }
    return ok();
  } catch (e) {
    // Never surface a failure to the visitor — the chat must not break.
    return ok({ ok: false });
  }
};
