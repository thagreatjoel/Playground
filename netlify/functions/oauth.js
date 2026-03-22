const fetch = require("node-fetch");

exports.handler = async (event) => {
  const path = event.path;
  const params = event.queryStringParameters || {};

  const CLIENT_ID     = process.env.CLIENT_ID;
  const CLIENT_SECRET = process.env.CLIENT_SECRET;
  const SUPABASE_URL  = process.env.SUPABASE_URL;
  const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_KEY;

  const REDIRECT_URI = "https://playground.dino.icu/.netlify/functions/oauth/callback";

  // ── STEP 1: Redirect to Hack Club OAuth ──
  if (path.endsWith("/oauth/login")) {
    const url = `https://auth.hackclub.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=openid%20email%20profile`;
    return { statusCode: 302, headers: { Location: url } };
  }

  // ── STEP 2: OAuth Callback ──
  if (path.endsWith("/oauth/callback")) {
    try {
      const code = params.code;
      if (!code) return { statusCode: 400, body: "Missing code" };

      // Exchange code for token
      const tokenRes = await fetch("https://auth.hackclub.com/oauth/token", {
        method: "POST",
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
      const userRes  = await fetch("https://auth.hackclub.com/oauth/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const user = JSON.parse(await userRes.text());

      const slack_id = user.sub || user.slack_id || null;
      const name     = user.name || user.display_name || "User";
      const email    = user.email || "";
      const avatar   = user.picture || user.avatar_url || "";

      // ── Upsert user into Supabase ──
      // If user already exists, do nothing (preserves existing resources)
      const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "apikey":        SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Prefer":        "resolution=ignore-duplicates", // don't overwrite existing row
        },
        body: JSON.stringify({
          slack_id,
          name,
          email,
          avatar,
          silicon:   50,  // starting resources for Quest 1
          conductor: 60,
          diode:     0,
        }),
      });

      console.log("UPSERT STATUS:", upsertRes.status);

      // Save user in cookie and redirect to dashboard
      return {
        statusCode: 302,
        headers: {
          "Set-Cookie": `user=${encodeURIComponent(JSON.stringify({
            ...user,
            slack_id,
            name,
            email,
            avatar,
          }))}; Path=/; SameSite=Lax`,
          Location: "/dashboard",
        },
      };

    } catch (err) {
      console.error("OAuth error:", err);
      return { statusCode: 500, body: "OAuth failed" };
    }
  }

  return { statusCode: 404, body: "Not found" };
};
