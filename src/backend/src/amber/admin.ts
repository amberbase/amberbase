import { Express, Request, Response } from 'express';
import {Config} from './config.js';
import {AmberRepo} from './db/repo.js';
import {ActionResult, nu, error, Tenant, TenantDetails, CreateTenantRequest} from './../../../client/src/shared/dtos.js';
import {AmberAuth, allTenantsId} from './auth.js';

export function enableAdminApi(app:Express, config:Config, repo:AmberRepo, authService: AmberAuth)  {
    

    // admin functionality for tenant admin management
    app.get('/tenants', async (req, res) => {
        if (!authService.checkAdmin(req, res)) return;
        var tenants = await repo.getTenants();
        res.send(nu<Tenant[]>(tenants));
    });

    app.delete('/tenant/:tenant', async (req, res) => {
        if (!authService.checkAdmin(req, res, true)) return;
        var tenant = req.params.tenant;
        if(tenant === allTenantsId) {
            res.status(404).send(error("Unable to delete the global tenant"));
            return;
        }
        await repo.deleteTenant(req.params.tenant);
        res.send(nu<ActionResult>({success:true}));
    });

    app.post('/tenants', async (req, res) => {
        if (!authService.checkAdmin(req, res)) return;
        var request : CreateTenantRequest = req.body;
        try{
        await repo.createTenant(request.id, request.name, request.data);
        } catch (e) 
        {
            res.status(400).send(error(e.message));
            return;
        }

        res.send(nu<ActionResult>({success:true}));

    });

    app.post('/tenant/:tenant', async (req, res) => {
        if (!authService.checkAdmin(req, res)) return;
        var request : TenantDetails = req.body;
        try{
        await repo.updateTenant(req.params.tenant, request.name, request.data);
        } catch (e) 
        {
            res.status(400).send(error(e.message));
            return;
        }

        res.send(nu<ActionResult>({success:true}));
    });


}
