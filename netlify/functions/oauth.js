exports.handler = async (event) => {
  const path = event.path;
  const params = event.queryStringParameters || {};

  const CLIENT_ID = process.env.CLIENT_ID;
  const CLIENT_SECRET = process.env.CLIENT_SECRET;

  const REDIRECT_URI =
    "https://playground.dino.icu/.netlify/functions/oauth/callback";

  // 👉 STEP 1: LOGIN → redirect to Hack Club
  if (path.endsWith("/oauth/login")) {
    const url = `https://auth.hackclub.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=openid%20email%20profile`;

    return {
      statusCode: 302,
      headers: {
        Location: url,
      },
    };
  }

  // 👉 STEP 2: CALLBACK
  if (path.endsWith("/oauth/callback")) {
    try {
      const code = params.code;

      if (!code) {
        return {
          statusCode: 400,
          body: "Missing code",
        };
      }

      // 🔥 EXCHANGE CODE FOR TOKEN (FIXED)
      const tokenRes = await fetch(
        "https://auth.hackclub.com/oauth/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
            redirect_uri: REDIRECT_URI,
            grant_type: "authorization_code",
          }),
        }
      );

      const tokenText = await tokenRes.text();
      console.log("TOKEN RESPONSE:", tokenText);

      if (!tokenText) {
        return {
          statusCode: 500,
          body: "Empty token response",
        };
      }

      const tokenData = JSON.parse(tokenText);

      if (!tokenData.access_token) {
        return {
          statusCode: 500,
          body: "No access token received",
        };
      }

      // 🔥 GET USER INFO
      const userRes = await fetch(
        "https://auth.hackclub.com/oauth/userinfo",
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        }
      );

      const userText = await userRes.text();
      console.log("USER RESPONSE:", userText);

      const user = JSON.parse(userText);

      // 🔥 SAVE USER IN COOKIE
      return {
        statusCode: 302,
        headers: {

          "Set-Cookie": `user=${encodeURIComponent(JSON.stringify(user))}; Path=/; SameSite=Lax`,   
        
          Location: "/dashboard",
        },
      };
    } catch (err) {
      console.error("ERROR:", err);

      return {
        statusCode: 500,
        body: "OAuth failed",
      };
    }
  }

  return {
    statusCode: 404,
    body: "Not found",
  };
};
