const { neon } = require("@netlify/neon");

function generateUserId() {
  // 4 char random alphanumeric e.g. "a3f9"
  return Math.random().toString(36).substring(2, 6);
}

exports.handler = async (event) => {
  const path   = event.path;
  const params = event.queryStringParameters || {};

  const CLIENT_ID     = process.env.CLIENT_ID;
  const CLIENT_SECRET = process.env.CLIENT_SECRET;
  const REDIRECT_URI  = "https://playground.dino.icu/.netlify/functions/oauth/callback";

  // ── STEP 1: Redirect to Hack Club ──
  if (path.endsWith("/oauth/login")) {
    const url = `https://auth.hackclub.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=openid%20email%20profile`;
    return { statusCode: 302, headers: { Location: url } };
  }

  // ── STEP 2: Callback ──
  if (path.endsWith("/oauth/callback")) {
    try {
      const code = params.code;
      if (!code) return { statusCode: 400, body: "Missing code" };

      const tokenRes = await fetch("https://auth.hackclub.com/oauth/token", {
        method:  "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id:     CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          redirect_uri:  REDIRECT_URI,
          grant_type:    "authorization_code",
        }),
      });

      const tokenData = JSON.parse(await tokenRes.text());
      if (!tokenData.access_token) return { statusCode: 500, body: "No access token" };

      const userRes = await fetch("https://auth.hackclub.com/oauth/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const user = JSON.parse(await userRes.text());

      const slack_id = user.sub || user.slack_id || null;
      const name     = user.name || user.display_name || "User";
      const email    = user.email || "";
      const avatar   = user.picture || user.avatar_url || "";

      const sql = neon(process.env.NETLIFY_DATABASE_URL);

      // Ensure table exists with user_id column
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          slack_id   TEXT PRIMARY KEY,
          user_id    TEXT UNIQUE,
          name       TEXT,
          email      TEXT,
          avatar     TEXT,
          silicon    INT DEFAULT 0,
          conductor  INT DEFAULT 0,
          diode      INT DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;

      // Add user_id column if it doesn't exist (for existing DBs)
      await sql`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id TEXT UNIQUE
      `;

      // Generate a unique user_id that doesn't clash
      let user_id = generateUserId();
      let attempts = 0;
      while (attempts < 10) {
        const [clash] = await sql`SELECT slack_id FROM users WHERE user_id = ${user_id}`;
        if (!clash) break;
        user_id = generateUserId();
        attempts++;
      }

      // Upsert — on re-login keep existing user_id, resources untouched
      const [row] = await sql`
        INSERT INTO users (slack_id, user_id, name, email, avatar, silicon, conductor, diode)
        VALUES (${slack_id}, ${user_id}, ${name}, ${email}, ${avatar}, 50, 60, 0)
        ON CONFLICT (slack_id) DO UPDATE
          SET name   = EXCLUDED.name,
              email  = EXCLUDED.email,
              avatar = EXCLUDED.avatar
        RETURNING user_id
      `;

      const finalUserId = row.user_id;
      console.log("Login:", slack_id, "→ user_id:", finalUserId);

      return {
        statusCode: 302,
        headers: {
          "Set-Cookie": `user=${encodeURIComponent(JSON.stringify({
            ...user, slack_id, name, email, avatar, user_id: finalUserId,
          }))}; Path=/; SameSite=Lax`,
          Location: `/dashboard/${finalUserId}`,
        },
      };

    } catch (err) {
      console.error("OAuth error:", err.message);
      return { statusCode: 500, body: `OAuth failed: ${err.message}` };
    }
  }

  return { statusCode: 404, body: "Not found" };
};
