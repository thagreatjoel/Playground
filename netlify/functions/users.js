const { neon } = require("@netlify/neon");

exports.handler = async (event) => {
  const { slack_id } = event.queryStringParameters || {};
  if (!slack_id) return { statusCode: 400, body: "Missing slack_id" };

  try {
    const sql  = neon(process.env.NETLIFY_DATABASE_URL);
    const rows = await sql`
      SELECT silicon, conductor, diode
      FROM users
      WHERE slack_id = ${slack_id}
      LIMIT 1
    `;

    if (rows.length === 0) return { statusCode: 404, body: "User not found" };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows[0]),
    };
  } catch (err) {
    console.error("user.js error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
