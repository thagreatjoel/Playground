const fetch = require("node-fetch");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const db = (path, options = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      "Content-Type":  "application/json",
      "apikey":        SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      ...(options.headers || {}),
    },
  });

exports.handler = async (event) => {
  const { action, slack_id } = event.queryStringParameters || {};

  // ── GET: fetch quests + user progress ──
  if (event.httpMethod === "GET" && action === "list") {
    if (!slack_id) return { statusCode: 400, body: "Missing slack_id" };

    // Fetch all quests
    const questsRes = await db("quests?order=order_index.asc");
    const quests    = await questsRes.json();

    // Fetch this user's completed quests
    const progressRes = await db(`user_quests?slack_id=eq.${slack_id}`);
    const progress    = await progressRes.json();

    const completedIds = new Set(progress.map(p => p.quest_id));

    const result = quests.map(q => ({
      ...q,
      completed: completedIds.has(q.id),
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  }

  // ── POST: complete a quest ──
  if (event.httpMethod === "POST" && action === "complete") {
    const body     = JSON.parse(event.body || "{}");
    const { quest_id } = body;
    const sid      = body.slack_id;

    if (!sid || !quest_id) return { statusCode: 400, body: "Missing fields" };

    // Check quest exists
    const questRes = await db(`quests?id=eq.${quest_id}`);
    const [quest]  = await questRes.json();
    if (!quest) return { statusCode: 404, body: "Quest not found" };

    // Check not already completed
    const checkRes  = await db(`user_quests?slack_id=eq.${sid}&quest_id=eq.${quest_id}`);
    const existing  = await checkRes.json();
    if (existing.length > 0) return { statusCode: 409, body: "Already completed" };

    // Check user has enough resources (for Quest 1 — the diffuser)
    if (quest.cost_silicon > 0 || quest.cost_conductor > 0) {
      const userRes   = await db(`users?slack_id=eq.${sid}`);
      const [user]    = await userRes.json();
      if (!user) return { statusCode: 404, body: "User not found" };

      if (user.silicon < quest.cost_silicon || user.conductor < quest.cost_conductor) {
        return { statusCode: 402, body: "Not enough resources" };
      }

      // Deduct costs
      await db(`users?slack_id=eq.${sid}`, {
        method: "PATCH",
        body: JSON.stringify({
          silicon:   user.silicon   - quest.cost_silicon,
          conductor: user.conductor - quest.cost_conductor,
          diode:     user.diode     + (quest.reward_diode || 0),
        }),
      });
    } else {
      // Just add rewards
      const userRes = await db(`users?slack_id=eq.${sid}`);
      const [user]  = await userRes.json();
      await db(`users?slack_id=eq.${sid}`, {
        method: "PATCH",
        body: JSON.stringify({
          silicon:   user.silicon   + (quest.reward_silicon   || 0),
          conductor: user.conductor + (quest.reward_conductor || 0),
          diode:     user.diode     + (quest.reward_diode     || 0),
        }),
      });
    }

    // Mark quest complete
    await db("user_quests", {
      method: "POST",
      body: JSON.stringify({ slack_id: sid, quest_id }),
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 404, body: "Not found" };
};
