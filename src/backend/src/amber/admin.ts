import { Express, Request, Response } from 'express';
import {Config} from './config.js';
import {AmberRepo} from './db/repo.js';
import {ActionResult, nu, error, Tenant, TenantDetails, CreateTenantRequest, UserInfo, UserDetails, ChangeUserRequest} from './../../../client/src/shared/dtos.js';
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

    // admin functionality for user management

    // Get all users
    app.get('/users', async (req, res) => {
        if (!authService.checkAdmin(req, res)) return;
        var users = await repo.getAllUsers();
        res.send(nu<UserInfo[]>(users));
        }
    );

    // Get user details by id
    app.get('/users/:id', async (req, res) => {
        if (!authService.checkAdmin(req, res)) return;
        var user = await repo.getUserDetails(req.params.id);
        if (!user) {
            res.status(404).send(error("User not found"));
            return;
        }
        res.send(nu<UserDetails>(user));
    });


    // Update user details. The admin can change the user name, email and password.
    app.post('/users/:id', async (req, res) => {
        if (!authService.checkAdmin(req, res)) return;
        var userId = req.params.id;
        var userDetails: ChangeUserRequest = req.body;

        try {
            await authService.changeUser(userId, userDetails.userName, userDetails.email, userDetails.newPassword);
            res.send(nu<ActionResult>({success:true}));
        } catch (e) {
            res.status(400).send(error(e.message));
        }
    });

    app.delete('/users/:id', async (req, res) => {
        if (!authService.checkAdmin(req, res, true)) return;
        var userId = req.params.id;
        if (userId === authService.getSessionToken(req)?.userId) {
            res.status(400).send(error("You cannot delete yourself"));
            return;
        }
        var user = await repo.getUserDetails(userId);
        if (!user){
            res.status(404).send(error("User not found"));
            return;
        }
        await repo.deleteUser(userId);
        res.send(nu<ActionResult>({success:true}));
    });


}
