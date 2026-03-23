const { neon } = require("@netlify/neon");

exports.handler = async (event) => {
  const { user_id } = event.queryStringParameters || {};

  if (!user_id) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing user_id" }) };
  }

  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    const [profile] = await sql`
      SELECT user_id, name, email, avatar, slack_id, created_at
      FROM users
      WHERE UPPER(user_id) = UPPER(${user_id})
    `;

    if (!profile) {
      // Debug: list all user_ids
      const all = await sql`SELECT user_id, name FROM users`;
      console.log("Not found. All users:", JSON.stringify(all));
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "User not found", all_users: all }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, user: profile }),
    };

  } catch (err) {
    console.error("profile.js error:", err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
