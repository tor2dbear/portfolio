// Only accept requests a browser made from one of the site's own origins. A
// cross-site page's fetch() carries an Origin the browser sets and cannot forge,
// so off-site callers are rejected; same-origin POSTs send Origin/Referer. When
// neither is present we allow, to avoid blocking privacy-hardened visitors.
function originAllowed(event) {
  const h = event.headers || {};
  const src = h.origin || h.Origin || h.referer || h.Referer || "";
  if (!src) {
    return true;
  }
  try {
    const host = new URL(src).hostname;
    return (
      host === "www.tor-bjorn.com" ||
      host === "tor-bjorn.com" ||
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".netlify.app")
    );
  } catch (e) {
    return false;
  }
}

// A single-line, deliberately conservative check: non-empty local part, an @,
// a domain with at least one dot, and no whitespace. Brevo validates downstream,
// so this just rejects obvious junk cheaply before the API call.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  if (!originAllowed(event)) {
    return { statusCode: 403, body: JSON.stringify({ error: "forbidden" }) };
  }

  const params = new URLSearchParams(event.body);
  const email = (params.get("EMAIL") || "").trim();

  if (!EMAIL_RE.test(email)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "invalid_email" }),
    };
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listId = parseInt(process.env.BREVO_LIST_ID, 10);

  if (!apiKey || !listId) {
    return { statusCode: 500, body: JSON.stringify({ error: "server_error" }) };
  }

  const response = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, listIds: [listId], updateEnabled: true }),
  });

  if (response.status === 201 || response.status === 204) {
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  const data = await response.json().catch(() => ({}));

  if (response.status === 400 && data.code === "duplicate_parameter") {
    return {
      statusCode: 200,
      body: JSON.stringify({ error: "already_subscribed" }),
    };
  }

  return { statusCode: 200, body: JSON.stringify({ error: "server_error" }) };
};
