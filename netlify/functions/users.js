const fetch = require("node-fetch");

exports.handler = async (event) => {
  const { slack_id } = event.queryStringParameters || {};
  if (!slack_id) return { statusCode: 400, body: "Missing slack_id" };

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  const res  = await fetch(`${SUPABASE_URL}/rest/v1/users?slack_id=eq.${slack_id}&select=silicon,conductor,diode`, {
    headers: {
      "apikey":        SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });

  const data = await res.json();
  if (!data || data.length === 0) return { statusCode: 404, body: "User not found" };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data[0]),
  };
};
