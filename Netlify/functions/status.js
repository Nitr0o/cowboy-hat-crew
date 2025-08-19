// netlify/functions/status.js
// Fetch live DayZ server info from BattleMetrics.
// - Filters to DayZ, searches by IP, then matches by ip + (port OR portQuery)
//   OR any listed "addresses" containing "ip:port".
// - Returns compact JSON for the frontend.
// - Falls back to "Chernarus" when BM doesn't provide map.

exports.handler = async (event) => {
  const { ip, port } = event.queryStringParameters || {};
  if (!ip || !port) return json(400, { error: "Missing ip or port" });

  try {
    const url =
      "https://api.battlemetrics.com/servers" +
      `?filter[game]=dayz` +
      `&filter[search]=${encodeURIComponent(ip)}` +
      `&page[size]=100`;

    const resp = await fetch(url, { headers: { Accept: "application/json" } });
    if (!resp.ok) return json(200, offlinePayload(ip, port, "Upstream not ok"));

    const data = await resp.json();
    const wantPort = Number(port);

    const candidates = data?.data || [];

    // Primary: exact ip + (port OR portQuery)
    let match = candidates.find((d) => {
      const a = d?.attributes || {};
      return (
        a.ip === ip &&
        (Number(a.port) === wantPort || Number(a.portQuery) === wantPort)
      );
    });

    // Fallback 1: any address equals "ip:port"
    if (!match) {
      match = candidates.find((d) => {
        const a = d?.attributes || {};
        const addresses = []
          .concat(a.addresses || [])
          .concat(a?.details?.addresses || [])
          .filter(Boolean);
        return addresses.some((s) => s === `${ip}:${wantPort}`);
      });
    }

    // Fallback 2: if there’s exactly ONE DayZ server on this IP, take it
    if (!match) {
      const ipOnly = candidates.filter((d) => (d?.attributes?.ip || "") === ip);
      if (ipOnly.length === 1) match = ipOnly[0];
    }

    if (!match) {
      return json(200, offlinePayload(ip, port, "No DayZ match on BM for given ip/port"));
    }

    const s = match.attributes || {};
    const statusStr = String(s.status || "").toLowerCase();
    const isOnline = statusStr === "online" || statusStr === "running";

    const map = (s.map ?? s.details?.map ?? null) || "Chernarus";

    return json(200, {
      online: isOnline,
      players: s.players ?? null,
      max: s.maxPlayers ?? null,
      name: s.name ?? null,
      map,
      ip: s.ip,
      port: s.port ?? s.portQuery ?? wantPort,
      note: "BM match OK",
    });

  } catch (err) {
    return json(200, offlinePayload(ip, port, "Lookup failed"));
  }
};

// Helpers
function json(statusCode, bodyObj) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=15",
    },
    body: JSON.stringify(bodyObj),
  };
}

function offlinePayload(ip, port, note) {
  return {
    online: false,
    players: 0,
    max: null,
    name: null,
    map: "Chernarus",
    ip,
    port: Number(port),
    note,
  };
}
