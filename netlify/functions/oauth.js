const { neon } = require("@netlify/neon");

function generateUserId() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
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

      // Exchange code for token
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

      // Get user info
      const userRes = await fetch("https://auth.hackclub.com/oauth/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const user = JSON.parse(await userRes.text());
      console.log("FULL USER OBJECT:", JSON.stringify(user));

      const slack_id = user.sub || user.slack_id || null;
      const name     = user.name || user.display_name || "User";
      const email    = user.email || "";

      const sql = neon(process.env.NETLIFY_DATABASE_URL);

      // Ensure tables exist
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

      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id TEXT UNIQUE`;

      // Generate unique user_id
      let user_id  = generateUserId();
      let attempts = 0;
      while (attempts < 10) {
        const clash = await sql`SELECT slack_id FROM users WHERE user_id = ${user_id}`;
        if (!clash[0]) break;
        user_id = generateUserId();
        attempts++;
      }

      // Upsert — only update name and email, preserve avatar and resources
      const rows = await sql`
        INSERT INTO users (slack_id, user_id, name, email, avatar, silicon, conductor, diode)
        VALUES (${slack_id}, ${user_id}, ${name}, ${email}, ${""}, 50, 60, 0)
        ON CONFLICT (slack_id) DO UPDATE
          SET name    = EXCLUDED.name,
              email   = EXCLUDED.email,
              user_id = COALESCE(users.user_id, EXCLUDED.user_id)
        RETURNING user_id, avatar
      `;

      const finalUserId = rows[0].user_id;
      const finalAvatar = rows[0].avatar || "";
      console.log("Login:", slack_id, "user_id:", finalUserId, "avatar length:", finalAvatar.length);

      return {
        statusCode: 302,
        headers: {
          "Set-Cookie": `user=${encodeURIComponent(JSON.stringify({
            ...user, slack_id, name, email,
            avatar:   finalAvatar,
            picture:  finalAvatar,
            user_id:  finalUserId,
          }))}; Path=/; SameSite=Lax`,
          Location: "/home",
        },
      };

    } catch (err) {
      console.error("OAuth error:", err.message, err.stack);
      return { statusCode: 500, body: "OAuth failed: " + err.message };
    }
  }

  return { statusCode: 404, body: "Not found" };
};
