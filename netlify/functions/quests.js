const { neon } = require("@netlify/neon");

async function setupTables(sql) {
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

  await sql`
    CREATE TABLE IF NOT EXISTS quests (
      id               SERIAL PRIMARY KEY,
      order_index      INT  NOT NULL,
      title            TEXT NOT NULL,
      description      TEXT,
      cost_silicon     INT  DEFAULT 0,
      cost_conductor   INT  DEFAULT 0,
      cost_diode       INT  DEFAULT 0,
      reward_silicon   INT  DEFAULT 0,
      reward_conductor INT  DEFAULT 0,
      reward_diode     INT  DEFAULT 0,
      created_at       TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_quests (
      id           SERIAL PRIMARY KEY,
      slack_id     TEXT REFERENCES users(slack_id) ON DELETE CASCADE,
      quest_id     INT  REFERENCES quests(id)      ON DELETE CASCADE,
      completed_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(slack_id, quest_id)
    )
  `;

  // Seed quests if empty
  const [{ count }] = await sql`SELECT COUNT(*) as count FROM quests`;
  if (parseInt(count) === 0) {
    await sql`
      INSERT INTO quests
        (order_index, title, description, cost_silicon, cost_conductor, cost_diode, reward_silicon, reward_conductor, reward_diode)
      VALUES
        (1, 'Construct a Diffuser',
         'You have been given 50 Silicon and 60 Conductors on login. Use them to construct your first diffuser circuit. This is your foundation.',
         50, 60, 0, 0, 0, 10),
        (2, 'Create a Project',
         'Start a new hardware project. Set up your repository and write a short description of what you are building.',
         0, 0, 0, 10, 10, 5),
        (3, 'Write a Journal Entry',
         'Document your build process. Write clearly about what you built, how it works, and what you learned.',
         0, 0, 0, 0, 0, 15),
        (4, 'Submit to GitHub',
         'Push your project to a public GitHub repository. Include your schematic, code, and journal.',
         0, 0, 0, 20, 0, 10),
        (5, 'Rebuild a Component',
         'Take a component from a real device and rebuild or replicate its function from scratch. Understand it deeply.',
         0, 0, 0, 15, 20, 20)
    `;
  }
}

exports.handler = async (event) => {
  const { action, slack_id } = event.queryStringParameters || {};

  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    // Auto-create tables + seed on every cold start
    await setupTables(sql);

    // ── GET: list quests with completion status ──
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
      const body         = JSON.parse(event.body || "{}");
      const { quest_id } = body;
      const sid          = body.slack_id;

      if (!sid || !quest_id) return { statusCode: 400, body: "Missing fields" };

      const [quest] = await sql`SELECT * FROM quests WHERE id = ${quest_id}`;
      if (!quest) return { statusCode: 404, body: "Quest not found" };

      const [existing] = await sql`
        SELECT id FROM user_quests WHERE slack_id = ${sid} AND quest_id = ${quest_id}
      `;
      if (existing) return { statusCode: 409, body: "Already completed" };

      const [user] = await sql`SELECT * FROM users WHERE slack_id = ${sid}`;
      if (!user) return { statusCode: 404, body: "User not found" };

      if (quest.cost_silicon > 0 || quest.cost_conductor > 0 || quest.cost_diode > 0) {
        if (
          user.silicon   < quest.cost_silicon   ||
          user.conductor < quest.cost_conductor ||
          user.diode     < quest.cost_diode
        ) {
          return { statusCode: 402, body: "Not enough resources" };
        }

        await sql`
          UPDATE users SET
            silicon   = silicon   - ${quest.cost_silicon}   + ${quest.reward_silicon},
            conductor = conductor - ${quest.cost_conductor} + ${quest.reward_conductor},
            diode     = diode     - ${quest.cost_diode}     + ${quest.reward_diode}
          WHERE slack_id = ${sid}
        `;
      } else {
        await sql`
          UPDATE users SET
            silicon   = silicon   + ${quest.reward_silicon},
            conductor = conductor + ${quest.reward_conductor},
            diode     = diode     + ${quest.reward_diode}
          WHERE slack_id = ${sid}
        `;
      }

      await sql`
        INSERT INTO user_quests (slack_id, quest_id) VALUES (${sid}, ${quest_id})
      `;

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: true }),
      };
    }

    // ── GET balance only ──
    if (event.httpMethod === "GET" && action === "balance") {
      if (!slack_id) return { statusCode: 400, body: "Missing slack_id" };
      const [user] = await sql`SELECT silicon, conductor, diode FROM users WHERE slack_id = ${slack_id}`;
      if (!user) return { statusCode: 404, body: "User not found" };
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      };
    }

    return { statusCode: 404, body: "Not found" };

  } catch (err) {
    console.error("quests.js error:", err);
    // Return the actual error message so you can debug
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
