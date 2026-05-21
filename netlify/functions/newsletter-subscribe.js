exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const params = new URLSearchParams(event.body);
  const email = (params.get("EMAIL") || "").trim();

  if (!email || !email.includes("@")) {
    return { statusCode: 400, body: JSON.stringify({ error: "invalid_email" }) };
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
    return { statusCode: 200, body: JSON.stringify({ error: "already_subscribed" }) };
  }

  return { statusCode: 200, body: JSON.stringify({ error: "server_error" }) };
};
