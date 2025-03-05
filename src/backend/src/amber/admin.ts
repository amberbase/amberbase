import { Express, Request, Response } from 'express';
import {Config} from './config.js';
import {AmberRepo, User} from './db/repo.js';
import {ActionResult, LoginRequest, nu, error, SessionToken as SessionTokenDto, RegisterRequest, AcceptInvitationRequest, UserDetails, CreateInvitationRequest, Tenant, TenantDetails, CreateTenantRequest} from 'amber-client';
import * as crypto from 'node:crypto';
import {AmberAuth, tenantAdminRole, allTenantsId} from './auth.js';

export function enableAdminApi(app:Express, config:Config, repo:AmberRepo, authService: AmberAuth)  {
    
    function checkAdmin(req:Request, res: Response) : boolean {
        var sessionToken = req.header('AmberSession');
        if (sessionToken) {
            var session = authService.validateSessionToken(sessionToken);
            if (session && session.roles.indexOf(tenantAdminRole) !== -1 && ( session.tenant === allTenantsId) ) {
                return true;
            }
        }
        res.status(401).send(error("Not authorized"));
        return false;
    }

    // admin functionality for tenant admin user management
    app.get(config.path + '/tenants', async (req, res) => {
        if (!checkAdmin(req, res)) return;
        var tenants = await repo.getTenants();
        res.send(nu<Tenant[]>(tenants));
    });

    app.delete(config.path + '/tenants/:tenant', async (req, res) => {
        if (!checkAdmin(req, res)) return;
        await repo.deleteTenant(req.params.tenant);
        res.send(nu<ActionResult>({success:true}));
    });

    app.post(config.path + '/tenants', async (req, res) => {
        if (!checkAdmin(req, res)) return;
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

    app.post(config.path + '/tenants/:tenant', async (req, res) => {
        if (!checkAdmin(req, res)) return;
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
