// netlify/functions/oauth.js

exports.handler = async (event) => {
  const { path, queryStringParameters } = event;

  // 🔐 ENV VARIABLES
  const CLIENT_ID = process.env.CLIENT_ID;
  const CLIENT_SECRET = process.env.CLIENT_SECRET;
  const REDIRECT_URI = "https://playground.dino.icu/.netlify/functions/oauth/callback";

  // 👉 STEP 1: Redirect to HackClub Auth
  if (path.endsWith("/oauth/login")) {
    const authUrl = `https://auth.hackclub.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=openid%20email%20profile`;

    return {
      statusCode: 302,
      headers: {
        Location: authUrl,
      },
    };
  }

  // 👉 STEP 2: Handle callback
  if (path.endsWith("/oauth/callback")) {
    const code = queryStringParameters.code;

    // Exchange code for token
    const tokenRes = await fetch("https://auth.hackclub.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    // Get user info
    const userRes = await fetch("https://auth.hackclub.com/oauth/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const user = await userRes.json();

    // 🔥 Save user in cookie (simple session)
    return {
      statusCode: 302,
      headers: {
        "Set-Cookie": `user=${encodeURIComponent(JSON.stringify(user))}; Path=/;`,
        Location: "/dashboard",
      },
    };
  }

  return {
    statusCode: 404,
    body: "Not found",
  };
};
