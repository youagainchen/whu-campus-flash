const http = require('http');
const fs = require('fs');
const path = require('path');
const { runCrawler } = require('./crawler');

let port = Number(process.env.PORT) || 8003;
const MESSAGES_FILE = './messages.json';

// 初始化消息文件
if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2));
}

// 定时任务：每小时自动更新一次数据
const UPDATE_INTERVAL = 60 * 60 * 1000;
setInterval(() => {
    Promise.resolve(runCrawler()).catch(console.error);
}, UPDATE_INTERVAL);

// 启动时先更新一次 (异步)
runCrawler().catch(console.error);

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

process.on('unhandledRejection', (reason) => {
    console.error('UnhandledRejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('UncaughtException:', error);
});

const server = http.createServer((req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    console.log(`[${req.method}] ${requestUrl.pathname}`);
    let filePath = '.' + requestUrl.pathname;
    if (filePath === './') filePath = './index.html';

    // API 路由处理
    if (requestUrl.pathname === '/api/messages') {
        if (req.method === 'GET') {
            fs.readFile(MESSAGES_FILE, (err, data) => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                if (err) {
                    res.end('[]');
                    return;
                }
                res.end(data || '[]');
            });
            return;
        } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                try {
                    const newMessage = JSON.parse(body);
                    newMessage.id = Date.now();
                    newMessage.time = new Date().toLocaleString();

                    const raw = fs.readFileSync(MESSAGES_FILE, 'utf8');
                    const messages = JSON.parse(raw && raw.trim().length ? raw : '[]');
                    messages.unshift(newMessage);
                    // 只保留最近 50 条消息
                    const trimmedMessages = messages.slice(0, 50);
                    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(trimmedMessages, null, 2));

                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: newMessage }));
                } catch (e) {
                    res.writeHead(400);
                    res.end('Invalid JSON');
                }
            });
            return;
        }

        res.writeHead(405);
        res.end('Method not allowed');
        return;
    }

    if (requestUrl.pathname === '/api/stats') {
        fs.readFile('./competitions.json', (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading stats');
                return;
            }
            const parsed = JSON.parse(data);
            const comps = Array.isArray(parsed.data) ? parsed.data : [];
            const stats = {
                byType: {},
                byCategory: {},
                bySource: {},
                timeline: {}
            };

            comps.forEach(c => {
                const type = c && typeof c.type === 'string' ? c.type : 'competition';
                stats.byType[type] = (stats.byType[type] || 0) + 1;
                stats.byCategory[c.category] = (stats.byCategory[c.category] || 0) + 1;
                stats.bySource[c.source] = (stats.bySource[c.source] || 0) + 1;
                const month = typeof c.date === 'string' ? c.date.substring(0, 7) : '';
                if (month && month.length === 7) {
                    stats.timeline[month] = (stats.timeline[month] || 0) + 1;
                }
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(stats));
        });
        return;
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.on('error', (error) => {
    if (error && error.code === 'EADDRINUSE') {
        port += 1;
        server.listen(port);
        return;
    }
    console.error('Server error:', error);
});

server.on('listening', () => {
    console.log(`Server running at http://localhost:${port}/`);
});

server.listen(port);
