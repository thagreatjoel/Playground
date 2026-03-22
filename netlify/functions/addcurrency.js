const { neon } = require("@netlify/neon");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method not allowed" };

  const { slack_id } = JSON.parse(event.body || "{}");
  if (!slack_id) return { statusCode: 400, body: "Missing slack_id" };

  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    const rows = await sql`
      UPDATE users
      SET silicon   = silicon   + 1,
          conductor = conductor + 1,
          diode     = diode     + 1
      WHERE slack_id = ${slack_id}
      RETURNING silicon, conductor, diode
    `;

    if (rows.length === 0) return { statusCode: 404, body: "User not found" };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows[0]),
    };
  } catch (err) {
    console.error("addcurrency error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
