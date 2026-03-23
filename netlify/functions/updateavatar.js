const { neon } = require("@netlify/neon");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method not allowed" };

  const { slack_id, avatar } = JSON.parse(event.body || "{}");

  if (!slack_id || !avatar)
    return { statusCode: 400, body: JSON.stringify({ error: "Missing slack_id or avatar" }) };

  // Only allow base64 images or http URLs
  if (!avatar.startsWith("data:image/") && !avatar.startsWith("http"))
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid avatar format" }) };

  // Limit size — base64 of 2MB image is ~2.7MB string
  if (avatar.length > 3 * 1024 * 1024)
    return { statusCode: 400, body: JSON.stringify({ error: "Avatar too large" }) };

  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    await sql`
      UPDATE users SET avatar = ${avatar}
      WHERE slack_id = ${slack_id}
    `;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("updateavatar error:", err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
