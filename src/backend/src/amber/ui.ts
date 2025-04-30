import * as express from 'express';
import {Config} from './config.js';
import { AmberAuth } from './auth.js';
import { fileURLToPath } from 'url';
import path from 'path';
import * as fs from 'fs';

export function enableUi(app: express.Express, config: Config, authService: AmberAuth) {

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const uiFolder = path.join(__dirname,"..", 'ui');

    app.get('/ui', (req: express.Request, res: express.Response) => {
        var content = fs.readFileSync(uiFolder + "/index.html", 'utf8');
        content = content.replace("**AMBER_UI_CONFIG**", config.ui ? JSON.stringify(config.ui) : "{}");
        res.status(200).type("text/html").send(content);
    });
    
    app.use("/ui", express.static(uiFolder, {index: false}));
}