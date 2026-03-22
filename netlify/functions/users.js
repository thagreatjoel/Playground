const { neon } = require("@netlify/neon");

exports.handler = async (event) => {
  const { slack_id } = event.queryStringParameters || {};
  if (!slack_id) return { statusCode: 400, body: "Missing slack_id" };

  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    // Ensure table exists
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        slack_id   TEXT PRIMARY KEY,
        name       TEXT,
        email      TEXT,
        avatar     TEXT,
        silicon    INT DEFAULT 0,
        conductor  INT DEFAULT 0,
        diode      INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    const rows = await sql`
      SELECT silicon, conductor, diode
      FROM users
      WHERE slack_id = ${slack_id}
      LIMIT 1
    `;

    // User row doesn't exist yet — return zeros instead of 404
    if (rows.length === 0) {
      console.warn("No user row found for:", slack_id);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ silicon: 0, conductor: 0, diode: 0 }),
      };
    }

    console.log("Fetched resources for", slack_id, rows[0]);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows[0]),
    };
  } catch (err) {
    console.error("user.js error:", err.message);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
