var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// _worker.js
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    const path = url.pathname;
    try {
      if (path === "/api/ai/synthesize" || path === "/api/gemini") {
        const apiKey = env.GEMINI_API_KEY || request.headers.get("x-gemini-key") || url.searchParams.get("apiKey") || "";
        let prompt = url.searchParams.get("prompt") || "Provide an executive intelligence assessment";
        let docText = url.searchParams.get("text") || "";
        if (request.method === "POST") {
          try {
            const body = await request.json();
            if (body.prompt) prompt = body.prompt;
            if (body.text) docText = body.text;
          } catch (e) {
          }
        }
        const fullPrompt = `${prompt}

DOCUMENT CONTENT:
${(docText || "").slice(0, 1e4)}

Provide a 3-sentence military-grade strategic summary for the Commander of Vitaflex Intelligence Corp.`;
        const gemResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${encodeURIComponent(apiKey.trim())}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }]
          })
        });
        const gemData = await gemResp.json();
        if (gemData.candidates && gemData.candidates[0]?.content?.parts[0]?.text) {
          const textResult = gemData.candidates[0].content.parts[0].text.trim();
          return new Response(JSON.stringify({ success: true, model: "gemini-3.5-flash-lite", text: textResult }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        return new Response(JSON.stringify(gemData), {
          status: gemResp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (path === "/api/firecrawl/scrape" || path === "/api/deep-scrape") {
        const apiKey = env.FIRECRAWL_API_KEY || request.headers.get("x-firecrawl-key") || url.searchParams.get("apiKey") || "";
        let targetUrl = url.searchParams.get("url");
        if (request.method === "POST") {
          try {
            const body = await request.json();
            if (body.url) targetUrl = body.url;
          } catch (e) {
          }
        }
        if (!targetUrl) {
          return new Response(JSON.stringify({ success: false, error: "Missing target URL" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        if (!apiKey) {
          return new Response(JSON.stringify({
            success: false,
            error: "Missing Firecrawl API Key. Configure FIRECRAWL_API_KEY in Cloudflare Pages environment variables."
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        const fcResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey.trim()}`
          },
          body: JSON.stringify({
            url: targetUrl,
            formats: ["markdown"],
            onlyMainContent: true
          })
        });
        const data = await fcResp.json();
        return new Response(JSON.stringify(data), {
          status: fcResp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (path.startsWith("/api/congress")) {
        const congressKey = env.CONGRESS_API_KEY || "hgpmVmRKcdNwd2jAJhcvAKTYaPcq2ZcJPOJbpTkh";
        const subEndpoint = url.searchParams.get("endpoint") || "bill";
        const limit = url.searchParams.get("limit") || "6";
        const queryParam = url.searchParams.get("q");
        let congressUrl = `https://api.congress.gov/v3/${subEndpoint}?api_key=${encodeURIComponent(congressKey)}&limit=${limit}&format=json`;
        if (queryParam) congressUrl += `&q=${encodeURIComponent(queryParam)}`;
        const cache = caches.default;
        const cacheKey = new Request(url.toString(), request);
        let cachedResponse = await cache.match(cacheKey);
        if (cachedResponse) {
          const resp = new Response(cachedResponse.body, cachedResponse);
          resp.headers.set("X-FlexAI-Cache", "HIT");
          for (const [k, v] of Object.entries(corsHeaders)) resp.headers.set(k, v);
          return resp;
        }
        const cResp = await fetch(congressUrl, {
          headers: { "User-Agent": "FlexAI-Terminal-Vitaflex/1.0" }
        });
        const data = await cResp.text();
        const edgeResponse = new Response(data, {
          status: cResp.status,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=600",
            // 10 minutes cache
            ...corsHeaders
          }
        });
        ctx.waitUntil(cache.put(cacheKey, edgeResponse.clone()));
        return edgeResponse;
      }
      if (path === "/api/rss") {
        const query = url.searchParams.get("q") || "Haiti";
        const googleRssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
        const cache = caches.default;
        const cacheKey = new Request(url.toString(), request);
        let cachedResponse = await cache.match(cacheKey);
        if (cachedResponse) {
          const resp = new Response(cachedResponse.body, cachedResponse);
          resp.headers.set("X-FlexAI-Cache", "HIT");
          for (const [k, v] of Object.entries(corsHeaders)) resp.headers.set(k, v);
          return resp;
        }
        const rssResponse = await fetch(googleRssUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
        });
        if (!rssResponse.ok) {
          return new Response(JSON.stringify({ error: "Failed to fetch RSS stream", status: rssResponse.status }), {
            status: 502,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const xmlText = await rssResponse.text();
        const items = parseRssFeed(xmlText);
        const responsePayload = JSON.stringify({
          status: "ok",
          query,
          count: items.length,
          cachedAt: (/* @__PURE__ */ new Date()).toISOString(),
          items
        });
        const edgeResponse = new Response(responsePayload, {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=480",
            // 8 minutes edge cache
            ...corsHeaders
          }
        });
        ctx.waitUntil(cache.put(cacheKey, edgeResponse.clone()));
        return edgeResponse;
      }
      if (path === "/api/tts") {
        const text = (url.searchParams.get("q") || "").slice(0, 200);
        const lang = url.searchParams.get("lang") === "ht" ? "fr" : url.searchParams.get("lang") || "en";
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(text)}`;
        const ttsResp = await fetch(ttsUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        });
        return new Response(ttsResp.body, {
          status: ttsResp.status,
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=86400",
            ...corsHeaders
          }
        });
      }
      if (path === "/api/live-intel") {
        const q = url.searchParams.get("q") || "Haiti security";
        const gnewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
        const rssResp = await fetch(gnewsUrl, {
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        const xml = await rssResp.text();
        const articles = parseRssFeed(xml).slice(0, 8);
        return new Response(JSON.stringify({ query: q, count: articles.length, articles, timestamp: (/* @__PURE__ */ new Date()).toISOString() }), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=120",
            ...corsHeaders
          }
        });
      }
      if (path === "/api/reliefweb") {
        const term = url.searchParams.get("query") || "haiti";
        const appName = env.RELIEFWEB_APPNAME || "vitaflex-flexai-v1";
        const rwUrl = `https://api.reliefweb.int/v2/reports?appname=${encodeURIComponent(appName)}&query[value]=${encodeURIComponent(term)}&limit=5`;
        const rwResp = await fetch(rwUrl);
        const data = await rwResp.text();
        return new Response(data, {
          status: rwResp.status,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=600",
            ...corsHeaders
          }
        });
      }
      if (path.startsWith("/api/satellite/tile/")) {
        const tileParts = path.replace("/api/satellite/tile/", "").split("/");
        if (tileParts.length >= 3) {
          const z = tileParts[0];
          const x = tileParts[1];
          const y = tileParts[2].replace(".jpg", "");
          const maptilerKey = env.MAPTILER_API_KEY || "FEEZqeafa7sxKNT5o27Q";
          const tileUrl = `https://api.maptiler.com/tiles/satellite-v2/${z}/${x}/${y}.jpg?key=${maptilerKey}`;
          const tResp = await fetch(tileUrl);
          return new Response(tResp.body, {
            status: tResp.status,
            headers: {
              "Content-Type": "image/jpeg",
              "Cache-Control": "public, max-age=86400",
              ...corsHeaders
            }
          });
        }
      }
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }
      return new Response(JSON.stringify({
        app: "Vitaflex Intelligence Corp Proxy Worker",
        organization: "Vitaflex Business Group",
        status: "online"
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  }
};
function parseRssFeed(xmlText) {
  const items = [];
  const itemMatches = xmlText.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const itemXml of itemMatches) {
    const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/title>/i);
    const linkMatch = itemXml.match(/<link>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/link>/i);
    const pubDateMatch = itemXml.match(/<pubDate>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/pubDate>/i);
    const descMatch = itemXml.match(/<description>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/description>/i);
    const sourceMatch = itemXml.match(/<source[^>]*>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/source>/i);
    let rawTitle = (titleMatch ? titleMatch[1] || titleMatch[2] : "").trim();
    let source = (sourceMatch ? sourceMatch[1] || sourceMatch[2] : "").trim();
    if (!source && rawTitle.includes(" - ")) {
      const parts = rawTitle.split(" - ");
      source = parts.pop().trim();
      rawTitle = parts.join(" - ").trim();
    }
    const cleanDesc = (descMatch ? descMatch[1] || descMatch[2] : "").replace(/<[^>]*>?/gm, "").trim();
    items.push({
      title: rawTitle,
      link: (linkMatch ? linkMatch[1] || linkMatch[2] : "").trim(),
      pubDate: (pubDateMatch ? pubDateMatch[1] || pubDateMatch[2] : "").trim(),
      description: cleanDesc,
      source: source || "News Wire"
    });
  }
  return items;
}
__name(parseRssFeed, "parseRssFeed");
export {
  worker_default as default
};
//# sourceMappingURL=bundledWorker-0.07879414659695183.mjs.map
