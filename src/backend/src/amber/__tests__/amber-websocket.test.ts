import { describe, expect, it } from 'vitest';
import * as http from 'http';
import express from 'express';
import WebSocket from 'ws';
import { Amber } from '../amber';
import { simpleWebsockets, WebsocketHandler } from '../websocket/websocket';
import type { AmberAuthService } from '../auth';

/**
 * Regression test for a bug where Amber.listen() created a brand-new http.Server
 * (via http.createServer(this.express).listen(...)) instead of going through
 * this.express.listen(...). AmberInit.create() replaces app.listen with a closure
 * that reuses the exact http.Server instance simpleWebsockets() attached its
 * 'upgrade' handler to - bypassing that closure silently breaks every websocket
 * connection (HTTP requests keep working since a fresh server serving the same
 * express app looks identical for plain HTTP).
 *
 * This sets up the same "reuse this server" wiring AmberInit.create() does,
 * without needing a real database, and proves a websocket connection actually
 * completes rather than being refused.
 */
describe('Amber.listen websocket wiring', () => {
  it('reuses the server simpleWebsockets attached its upgrade handler to', async () => {
    const app = express();
    const server = http.createServer(app);
    app.listen = ((...args: any[]) => {
      return (server.listen as any)(...args);
    }) as any;

    const handler: WebsocketHandler = (_path, _protocol, _sessionToken) => {
      return (socket) => {
        socket.sendJson({ hello: 'world' });
      };
    };
    simpleWebsockets(server, [handler], '/amber', {} as AmberAuthService);

    const amber = new Amber(app, {} as any, {} as any, {} as any, {} as any, {} as any);

    const listeningServer = amber.listen(0, '127.0.0.1');
    expect(listeningServer).toBe(server);

    await new Promise<void>((resolve) => listeningServer.once('listening', resolve));
    const address = listeningServer.address();
    if (address === null || typeof address === 'string') {
      throw new Error('expected an AddressInfo from the listening server');
    }

    try {
      const message = await new Promise<any>((resolve, reject) => {
        const ws = new WebSocket(`ws://127.0.0.1:${address.port}/amber/some/path`);
        ws.on('open', () => {});
        ws.on('message', (data) => {
          resolve(JSON.parse(data.toString()));
          ws.close();
        });
        ws.on('error', reject);
        setTimeout(() => reject(new Error('websocket connection timed out')), 2000);
      });

      expect(message).toEqual({ hello: 'world' });
    } finally {
      listeningServer.close();
    }
  });
});
