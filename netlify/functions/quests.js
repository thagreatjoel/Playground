const { neon } = require("@netlify/neon");

exports.handler = async (event) => {
  const { action, slack_id } = event.queryStringParameters || {};

  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    // ── GET: list all quests with user completion status ──
    if (event.httpMethod === "GET" && action === "list") {
      if (!slack_id) return { statusCode: 400, body: "Missing slack_id" };

      const rows = await sql`
        SELECT
          q.*,
          CASE WHEN uq.quest_id IS NOT NULL THEN true ELSE false END AS completed
        FROM quests q
        LEFT JOIN user_quests uq
          ON uq.quest_id = q.id AND uq.slack_id = ${slack_id}
        ORDER BY q.order_index ASC
      `;

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows),
      };
    }

    // ── POST: complete a quest ──
    if (event.httpMethod === "POST" && action === "complete") {
      const body     = JSON.parse(event.body || "{}");
      const { quest_id } = body;
      const sid      = body.slack_id;

      if (!sid || !quest_id) return { statusCode: 400, body: "Missing fields" };

      // Fetch quest
      const [quest] = await sql`SELECT * FROM quests WHERE id = ${quest_id}`;
      if (!quest) return { statusCode: 404, body: "Quest not found" };

      // Check already completed
      const [existing] = await sql`
        SELECT id FROM user_quests
        WHERE slack_id = ${sid} AND quest_id = ${quest_id}
      `;
      if (existing) return { statusCode: 409, body: "Already completed" };

      // Fetch user
      const [user] = await sql`SELECT * FROM users WHERE slack_id = ${sid}`;
      if (!user) return { statusCode: 404, body: "User not found" };

      // Check resources if quest has a cost
      if (quest.cost_silicon > 0 || quest.cost_conductor > 0 || quest.cost_diode > 0) {
        if (
          user.silicon   < quest.cost_silicon   ||
          user.conductor < quest.cost_conductor ||
          user.diode     < quest.cost_diode
        ) {
          return { statusCode: 402, body: "Not enough resources" };
        }

        // Deduct costs and add rewards atomically
        await sql`
          UPDATE users SET
            silicon   = silicon   - ${quest.cost_silicon}   + ${quest.reward_silicon},
            conductor = conductor - ${quest.cost_conductor} + ${quest.reward_conductor},
            diode     = diode     - ${quest.cost_diode}     + ${quest.reward_diode}
          WHERE slack_id = ${sid}
        `;
      } else {
        // Free quest — just add rewards
        await sql`
          UPDATE users SET
            silicon   = silicon   + ${quest.reward_silicon},
            conductor = conductor + ${quest.reward_conductor},
            diode     = diode     + ${quest.reward_diode}
          WHERE slack_id = ${sid}
        `;
      }

      // Record completion
      await sql`
        INSERT INTO user_quests (slack_id, quest_id)
        VALUES (${sid}, ${quest_id})
      `;

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: true }),
      };
    }

    return { statusCode: 404, body: "Not found" };

  } catch (err) {
    console.error("quests.js error:", err);
    return { statusCode: 500, body: "Database error" };
  }
};
