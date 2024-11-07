import http from 'http';
import url from 'url';
import { Image } from '../models/imageModel'

export const server = http.createServer((req : http.IncomingMessage, res : http.ServerResponse) => {
  routeRequest(req, res);
});

function routeRequest(req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage>) {
    let uri : string = '';
    if (typeof req.url != 'undefined') { uri = req.url; }
    const parsedUrl = url.parse(uri, true)
    res.setHeader('Content-Type', 'application/json');

    // available routes
    if (parsedUrl.pathname === '/api/users' && req.method === 'GET') 
    {
        // handleGetUsers(req, res);
    } 
    else if (parsedUrl.pathname === '/api/users' && req.method === 'POST') 
    {
        // handleCreateUser(req, res);
    } 
    // default, 404 route
    else 
    {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Route not found' }));
    }
}