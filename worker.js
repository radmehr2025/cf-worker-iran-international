// آدرس استریم شبکه
const MAIN_STREAM_URL = "https://live.livetvstream.co.uk/LS-63503-4/index.m3u8";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname === "/") {
      return new Response(getHtml(), {
        headers: { "Content-Type": "text/html;charset=UTF-8" }
      });
    }
   
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        }
      });
    }
  
    let targetUrl = "";
    if (url.pathname === "/stream.m3u8") {
      targetUrl = MAIN_STREAM_URL;
    } else if (url.pathname === "/proxy") {
      targetUrl = url.searchParams.get("url");
    } else {
      return new Response("Not Found", { status: 404 });
    }

    if (!targetUrl) {
      return new Response("Missing URL", { status: 400 });
    }
  
    try {
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
          "Referer": new URL(targetUrl).origin
        }
      });

      let body = response.body;
      const contentType = response.headers.get("Content-Type") || "";
     
      if (contentType.includes("mpegurl") || contentType.includes("mpegURL") || targetUrl.includes(".m3u8")) {
        let text = await response.text();
        const targetUrlObj = new URL(targetUrl);
        const basePath = targetUrlObj.href.substring(0, targetUrlObj.href.lastIndexOf('/') + 1);

        const lines = text.split('\n');
        const rewrittenLines = lines.map(line => {
          line = line.trim();
          
          if (line && !line.startsWith('#')) {
            let absoluteUrl = line;
            if (!line.startsWith('http')) {
              absoluteUrl = line.startsWith('/') ? targetUrlObj.origin + line : basePath + line;
            }
            return `${url.origin}/proxy?url=${encodeURIComponent(absoluteUrl)}`;
          }
          
          if (line.startsWith('#EXT-X-KEY') || line.startsWith('#EXT-X-MAP')) {
             return line.replace(/URI="([^"]+)"/, (match, p1) => {
                let absoluteUrl = p1;
                if (!p1.startsWith('http')) {
                  absoluteUrl = p1.startsWith('/') ? targetUrlObj.origin + p1 : basePath + p1;
                }
                return `URI="${url.origin}/proxy?url=${encodeURIComponent(absoluteUrl)}"`;
             });
          }
          return line;
        });

        body = rewrittenLines.join('\n');
      }

      const newResponse = new Response(body, response);
      newResponse.headers.set("Access-Control-Allow-Origin", "*");
      newResponse.headers.delete("Content-Encoding");
      newResponse.headers.delete("Content-Length");

      return newResponse;
      
    } catch (error) {
      return new Response("Error fetching the stream: " + error.message, { status: 500 });
    }
  }
};

function getHtml() {
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#09090b">
    <title>پخش زنده ایران اینترنشنال</title>
    
     <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700&display=swap" rel="stylesheet">

   
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    
    <style>
        :root {
            --bg-base: #09090b;
            --bg-surface: #18181b;
            --border-color: #27272a;
            --text-primary: #fafafa;
            --text-secondary: #a1a1aa;
            --accent: #e11d48; 
            --accent-glow: rgba(225, 29, 72, 0.15);
            --info-bg: rgba(56, 189, 248, 0.1);
            --info-text: #38bdf8;
            --info-border: rgba(56, 189, 248, 0.2);
            --success-text: #10b981;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: var(--bg-base);
            color: var(--text-primary);
            font-family: 'Vazirmatn', Tahoma, sans-serif;
            -webkit-font-smoothing: antialiased;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
    
        header {
            background: rgba(9, 9, 11, 0.75);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border-color);
            padding: 16px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 50;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 700;
            font-size: 1.1rem;
        }

        .brand svg {
            width: 24px;
            height: 24px;
            color: var(--text-primary);
        }

        .live-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(225, 29, 72, 0.1);
            color: var(--accent);
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 700;
            border: 1px solid rgba(225, 29, 72, 0.2);
        }

        .pulse {
            width: 8px;
            height: 8px;
            background-color: var(--accent);
            border-radius: 50%;
            animation: pulse-animation 2s infinite;
        }

        @keyframes pulse-animation {
            0% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.7); }
            70% { box-shadow: 0 0 0 6px rgba(225, 29, 72, 0); }
            100% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0); }
        }

        main {
            flex: 1;
            width: 100%;
            max-width: 900px;
            margin: 0 auto;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        .player-container {
            width: 100%;
            background: #000;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid var(--border-color);
            box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 40px var(--accent-glow);
            position: relative;
            aspect-ratio: 16 / 9;
        }

        video {
            width: 100%;
            height: 100%;
            object-fit: contain;
            background: #000;
        }

        .info-card {
            background: var(--bg-surface);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .status-row {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 0.95rem;
            font-weight: 500;
            color: var(--success-text);
        }

        .status-row svg {
            width: 22px;
            height: 22px;
        }

        .notice-box {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            background: var(--info-bg);
            border: 1px solid var(--info-border);
            padding: 16px;
            border-radius: 12px;
            color: var(--info-text);
            font-size: 0.9rem;
            line-height: 1.7;
        }

        .notice-box svg {
            width: 22px;
            height: 22px;
            flex-shrink: 0;
            margin-top: 2px;
        }

        @media (max-width: 640px) {
            header {
                padding: 14px 16px;
            }
            .brand {
                font-size: 1rem;
            }
            main {
                padding: 16px 12px;
                gap: 16px;
            }
            .player-container {
                border-radius: 12px;
            }
            .info-card {
                padding: 16px;
                border-radius: 12px;
            }
            .notice-box {
                font-size: 0.85rem;
                padding: 14px;
            }
        }
    </style>
</head>
<body>

    <header>
        <div class="brand">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            ایران اینترنشنال
        </div>
        <div class="live-badge">
            <div class="pulse"></div>
            پخش زنده
        </div>
    </header>
    
    <main>

        <div class="player-container">
            <video id="video" controls autoplay playsinline></video>
        </div>
        
        <div class="info-card">
            <div class="status-row">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.965 11.965 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                اتصال امن و بدون نیاز به فیلترشکن برقرار است
            </div>
            <div class="notice-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <div>
                    در اولین بارگذاری، لطفاً برای برقراری ارتباط با سرورها و دریافت جدیدترین لینک شبکه کمی شکیبا باشید.
                </div>
            </div>
        </div>
    </main>

    <script>
        var video = document.getElementById('video');
        var videoSrc = '/stream.m3u8'; 
        
        if (Hls.isSupported()) {
            var hls = new Hls();
            hls.loadSource(videoSrc);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
                video.play().catch(function() {
                    console.log("مرورگر از پخش خودکار با صدا جلوگیری کرد. کاربر باید دکمه پلی را بزند.");
                });
            });
        } 
        else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = videoSrc;
            video.addEventListener('loadedmetadata', function() {
                video.play().catch(function() {
                    console.log("مرورگر از پخش خودکار با صدا جلوگیری کرد.");
                });
            });
        }
    </script>
</body>
</html>`;
}
