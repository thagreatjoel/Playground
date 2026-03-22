const { neon } = require("@netlify/neon");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method not allowed" };

  let slack_id;
  try {
    slack_id = JSON.parse(event.body || "{}").slack_id;
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  if (!slack_id) return { statusCode: 400, body: "Missing slack_id" };

  console.log("addcurrency called for:", slack_id);

  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    // Upsert — create user row if it doesn't exist, then add currency
    const rows = await sql`
      INSERT INTO users (slack_id, silicon, conductor, diode)
      VALUES (${slack_id}, 1, 1, 1)
      ON CONFLICT (slack_id) DO UPDATE
        SET silicon   = users.silicon   + 1,
            conductor = users.conductor + 1,
            diode     = users.diode     + 1
      RETURNING silicon, conductor, diode
    `;

    console.log("Updated resources:", rows[0]);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows[0]),
    };
  } catch (err) {
    console.error("addcurrency error:", err.message);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
