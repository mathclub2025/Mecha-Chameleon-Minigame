import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Vite Dev Server Plugin: Auto-save game result JSON files directly to local 'results/' folder on disk
function saveResultsPlugin() {
    return {
        name: 'save-results-plugin',
        configureServer(server) {
            // 1. POST /api/save-result: Writes a played game JSON directly to results/
            server.middlewares.use('/api/save-result', (req, res, next) => {
                if (req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => body += chunk.toString());
                    req.on('end', () => {
                        try {
                            const data = JSON.parse(body);
                            const resultsDir = path.resolve(__dirname, 'results');
                            if (!fs.existsSync(resultsDir)) {
                                fs.mkdirSync(resultsDir, { recursive: true });
                            }
                            const rawName = data.playerName || data.name || 'Agent';
                            const safeName = rawName.replace(/[^a-zA-Z0-9_-]/g, '_');
                            const now = new Date();
                            const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}-${String(now.getSeconds()).padStart(2,'0')}`;
                            const fileName = `${safeName}-${timeStr}.json`;
                            const filePath = path.join(resultsDir, fileName);
                            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
                            console.log(`\x1b[32m[Results Server]\x1b[0m Saved game result JSON to: \x1b[36m${filePath}\x1b[0m`);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ success: true, savedFile: fileName }));
                        } catch (err) {
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ error: err.message }));
                        }
                    });
                } else {
                    next();
                }
            });

            // 2. GET /api/get-offline-results: Reads all local JSON results from disk
            server.middlewares.use('/api/get-offline-results', (req, res, next) => {
                if (req.method === 'GET') {
                    try {
                        const resultsDir = path.resolve(__dirname, 'results');
                        if (!fs.existsSync(resultsDir)) {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify([]));
                            return;
                        }
                        const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json'));
                        const results = [];
                        files.forEach(file => {
                            try {
                                const content = fs.readFileSync(path.join(resultsDir, file), 'utf-8');
                                results.push({ filename: file, data: JSON.parse(content) });
                            } catch (err) {
                                console.error(`Error reading offline result file ${file}:`, err);
                            }
                        });
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(results));
                    } catch (err) {
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: err.message }));
                    }
                } else {
                    next();
                }
            });

            // 3. POST /api/delete-offline-result: Deletes a local JSON result after sync
            server.middlewares.use('/api/delete-offline-result', (req, res, next) => {
                if (req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => body += chunk.toString());
                    req.on('end', () => {
                        try {
                            const { filename } = JSON.parse(body);
                            const resultsDir = path.resolve(__dirname, 'results');
                            const filePath = path.join(resultsDir, filename);
                            if (fs.existsSync(filePath)) {
                                fs.unlinkSync(filePath);
                                console.log(`\x1b[33m[Results Server]\x1b[0m Synced and deleted local JSON file: \x1b[36m${filename}\x1b[0m`);
                            }
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ success: true }));
                        } catch (err) {
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ error: err.message }));
                        }
                    });
                } else {
                    next();
                }
            });
        }
    };
}

export default defineConfig({
    plugins: [saveResultsPlugin()]
});
