import * as express from 'express';
import {Config} from './config.js';
import { AmberAuth } from './auth.js';
import { fileURLToPath } from 'url';
import path from 'path';
import * as fs from 'fs';
import { AmberUiContext } from '../../../shared/src/index.js';
import { AmberRepo } from './db/repo.js';

export function enableUi(app: express.Express, config: Config, repo: AmberRepo, auth: AmberAuth) {

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const uiFolder = path.join(__dirname,"..", 'ui');

    function renderIndex(req: express.Request, res: express.Response, uiContext: AmberUiContext) {
        var content = fs.readFileSync(uiFolder + "/index.html", 'utf8');
        content = content.replaceAll("**AMBER_UI_CONFIG**", config.ui ? JSON.stringify(config.ui) : "{}");
        content = content.replaceAll("**AMBER_UI_CONTEXT**", JSON.stringify(uiContext));
        res.status(200).type("text/html").send(content);
    }

    app.get('/ui-login', async (req: express.Request, res: express.Response) => {
        const uiContext: AmberUiContext = {
            view: "login",
        };
        var tenant = req.query.tenant as string;
        if (tenant){
            var tenantFromRepo = await repo.getTenant(tenant);
            if (!tenantFromRepo) {
                res.status(404).send("Tenant not found");
                return;
            }
            uiContext.tenant = tenant;
            uiContext.tenantName = tenantFromRepo.name;
        }
        
        renderIndex(req, res, uiContext);
    });
    
    app.use("/ui", express.static(uiFolder, {index: false}));
}