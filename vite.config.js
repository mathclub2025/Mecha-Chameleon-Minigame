import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Vite Dev Server Plugin: Auto-save game result JSON files directly to local 'results/' folder on disk
function saveResultsPlugin() {
    return {
        name: 'save-results-plugin',
        configureServer(server) {
            server.middlewares.use('/api/save-result', (req, res, next) => {
                if (req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => {
                        body += chunk.toString();
                    });
                    req.on('end', () => {
                        try {
                            const data = JSON.parse(body);
                            const resultsDir = path.resolve(__dirname, 'results');
                            
                            // Ensure 'results/' folder exists in project root
                            if (!fs.existsSync(resultsDir)) {
                                fs.mkdirSync(resultsDir, { recursive: true });
                            }

                            // Format file name: playername-time.json
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
                            res.end(JSON.stringify({ success: true, savedFile: fileName, filePath: filePath }));
                        } catch (err) {
                            console.error('[Results Server] Error saving result:', err);
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
