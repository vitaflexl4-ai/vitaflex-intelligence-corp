const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const PORT2 = 8080;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.geojson': 'application/geo+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ico': 'image/x-icon'
};

function requestHandler(req, res) {
  // CORS & Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 1. DYNAMIC NATURAL VOICE TTS ENDPOINT (/api/tts?q=...&lang=...)
  if (pathname === '/api/tts') {
    const queryText = (parsedUrl.query.q || '').slice(0, 200);
    const lang = parsedUrl.query.lang === 'ht' ? 'fr' : (parsedUrl.query.lang || 'en');

    if (!queryText) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing text query');
      return;
    }

    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(queryText)}`;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };

    https.get(ttsUrl, options, (ttsRes) => {
      if (ttsRes.statusCode === 200) {
        res.writeHead(200, {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400'
        });
        ttsRes.pipe(res);
      } else {
        res.writeHead(ttsRes.statusCode, { 'Content-Type': 'text/plain' });
        res.end('TTS Upstream Error');
      }
    }).on('error', (err) => {
      console.warn('[TTS Proxy Error]', err);
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('TTS connection failed');
    });
    return;
  }

  // 2. LIVE WEB INTELLIGENCE SEARCH ENDPOINT (/api/live-intel?q=...)
  if (pathname === '/api/live-intel') {
    const q = (parsedUrl.query.q || 'Haiti security news').trim();
    const gnewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
    
    https.get(gnewsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (rssRes) => {
      let data = '';
      rssRes.on('data', chunk => data += chunk);
      rssRes.on('end', () => {
        const articles = [];
        const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<description>(.*?)<\/description>[\s\S]*?<\/item>/gi;
        let match;
        while ((match = itemRegex.exec(data)) !== null && articles.length < 8) {
          let title = match[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
          let link = match[2].trim();
          let pubDate = match[3].trim();
          let snippet = match[4].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim();
          
          let source = 'News Desk';
          if (title.includes(' - ')) {
            const parts = title.split(' - ');
            source = parts.pop();
            title = parts.join(' - ');
          }

          articles.push({ title, source, snippet, pubDate, link });
        }

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=120'
        });
        res.end(JSON.stringify({ query: q, count: articles.length, articles, timestamp: new Date().toISOString() }));
      });
    }).on('error', (err) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message, articles: [] }));
    });
    return;
  }

    // 2B. FIRECRAWL DEEP OSINT & SCRAPE ENDPOINT (/api/firecrawl/scrape)
  if (pathname === '/api/firecrawl/scrape' || pathname === '/api/deep-scrape') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let targetUrl = parsedUrl.query.url;
      let apiKey = parsedUrl.query.apiKey || req.headers['x-firecrawl-key'] || process.env.FIRECRAWL_API_KEY || '';

      if (body) {
        try {
          const parsed = JSON.parse(body);
          if (parsed.url) targetUrl = parsed.url;
          if (parsed.apiKey) apiKey = parsed.apiKey;
        } catch (e) {}
      }

      if (!targetUrl) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Missing target URL parameter' }));
        return;
      }

      if (!apiKey) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Missing Firecrawl API Key. Enter your key in the Integrations hub or set FIRECRAWL_API_KEY.' 
        }));
        return;
      }

      const postData = JSON.stringify({
        url: targetUrl,
        formats: ['markdown'],
        onlyMainContent: true
      });

      const options = {
        hostname: 'api.firecrawl.dev',
        port: 443,
        path: '/v1/scrape',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const fcReq = https.request(options, (fcRes) => {
        let respData = '';
        fcRes.on('data', chunk => respData += chunk);
        fcRes.on('end', () => {
          res.writeHead(fcRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(respData);
        });
      });

      fcReq.on('error', (err) => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      });

      fcReq.write(postData);
      fcReq.end();
    });
    return;
  }

    // 2C. GEMINI GOOGLE AI STUDIO SYNTHESIS ENDPOINT (/api/ai/synthesize)
  if (pathname === '/api/ai/synthesize' || pathname === '/api/gemini') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let prompt = parsedUrl.query.prompt || 'Provide a strategic executive briefing for Vitaflex Intelligence Corp';
      let docText = parsedUrl.query.text || '';
      let apiKey = parsedUrl.query.apiKey || req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY || '';

      if (body) {
        try {
          const parsed = JSON.parse(body);
          if (parsed.prompt) prompt = parsed.prompt;
          if (parsed.text) docText = parsed.text;
          if (parsed.apiKey) apiKey = parsed.apiKey;
        } catch(e) {}
      }

      const fullPrompt = `${prompt}\n\nDOCUMENT DATA:\n${(docText || '').slice(0, 10000)}\n\nProvide a concise 3-4 sentence tactical assessment for the Commander of Vitaflex Intelligence Corp.`;

      const postData = JSON.stringify({
        contents: [{
          parts: [{ text: fullPrompt }]
        }]
      });

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        port: 443,
        path: `/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${encodeURIComponent(apiKey.trim())}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const aiReq = https.request(options, (aiRes) => {
        let respData = '';
        aiRes.on('data', chunk => respData += chunk);
        aiRes.on('end', () => {
          try {
            const parsed = JSON.parse(respData);
            if (parsed.candidates && parsed.candidates[0]?.content?.parts[0]?.text) {
              const textResult = parsed.candidates[0].content.parts[0].text.trim();
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, model: 'gemini-3.5-flash-lite', text: textResult }));
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(respData);
            }
          } catch(err) {
            res.writeHead(aiRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(respData);
          }
        });
      });

      aiReq.on('error', (err) => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      });

      aiReq.write(postData);
      aiReq.end();
    });
    return;
  }

  // 3. STATIC FILE SERVING
  let reqPath = decodeURI(pathname);

  // Route aliases
  if (reqPath === '/' || reqPath === '/admin' || reqPath === '/admin/') {
    reqPath = '/admin.html';
  } else if (reqPath === '/public' || reqPath === '/briefing' || reqPath === '/flexai') {
    reqPath = '/index.html';
  }

  let filePath = path.join(ROOT, reqPath);

  // Security check
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      const htmlPath = filePath + '.html';
      if (fs.existsSync(htmlPath)) {
        filePath = htmlPath;
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
    } else if (stats.isDirectory()) {
      const idxPath = path.join(filePath, 'index.html');
      if (fs.existsSync(idxPath)) {
        filePath = idxPath;
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Directory listing disabled');
        return;
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const stat = fs.statSync(filePath);
    const range = req.headers.range;

    if (range && ext === '.mp3') {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
}

const server1 = http.createServer(requestHandler);
server1.listen(PORT, '0.0.0.0', () => {
  console.log(`FlexAI Command Center listening on 0.0.0.0:${PORT}`);
  const server2 = http.createServer(requestHandler);
  server2.listen(PORT2, '0.0.0.0', () => {
    console.log(`FlexAI also listening on 0.0.0.0:${PORT2}`);
  });
});
