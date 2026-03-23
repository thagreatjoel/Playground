const { neon } = require("@netlify/neon");
const { ADMINS } = require("./admins");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method not allowed" };

  const body = JSON.parse(event.body || "{}");
  const { action, slack_id, silicon, conductor, diode, requester_user_id } = body;

  // ── Check admin access ──
  if (!requester_user_id || !ADMINS.includes(requester_user_id)) {
    return {
      statusCode: 403,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Access denied — not an admin" }),
    };
  }

  if (!slack_id) return { statusCode: 400, body: JSON.stringify({ error: "Missing slack_id" }) };

  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    const [user] = await sql`SELECT * FROM users WHERE slack_id = ${slack_id}`;
    if (!user) return { statusCode: 404, body: JSON.stringify({ error: "User not found" }) };

    if (action === "give") {
      const [updated] = await sql`
        UPDATE users SET
          silicon   = silicon   + ${silicon   || 0},
          conductor = conductor + ${conductor || 0},
          diode     = diode     + ${diode     || 0}
        WHERE slack_id = ${slack_id}
        RETURNING slack_id, name, silicon, conductor, diode
      `;
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ success: true, user: updated }) };
    }

    if (action === "set") {
      const [updated] = await sql`
        UPDATE users SET
          silicon   = ${silicon   ?? user.silicon},
          conductor = ${conductor ?? user.conductor},
          diode     = ${diode     ?? user.diode}
        WHERE slack_id = ${slack_id}
        RETURNING slack_id, name, silicon, conductor, diode
      `;
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ success: true, user: updated }) };
    }

    if (action === "reset") {
      const [updated] = await sql`
        UPDATE users SET silicon = 0, conductor = 0, diode = 0
        WHERE slack_id = ${slack_id}
        RETURNING slack_id, name, silicon, conductor, diode
      `;
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ success: true, user: updated }) };
    }

    if (action === "lookup") {
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ success: true, user }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: "Unknown action" }) };

  } catch (err) {
    console.error("admin error:", err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
