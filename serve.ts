import { createReadStream, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/* Leonida Trophy Guide — local static server.
   Serves app/ at its root on http://localhost:8080 so the guide can be
   tried in a browser exactly as the grader serves it. No build step,
   no network: only files under app/ are ever served. */

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const appRoot = resolve(join(repoRoot, 'app'));
const port = Number(process.env.PORT || 8080);

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function safePath(urlPath: string): string | null {
  const decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  const joined = resolve(join(appRoot, normalize('/' + decoded).replace(/^\/+/, '')));
  if (joined !== appRoot && !joined.startsWith(appRoot + sep)) return null;
  return joined;
}

function sendError(response: ServerResponse, status: number, message: string): void {
  if (!response.headersSent) {
    response.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
  }
  response.end(message + '\n');
}

const server = createServer((request: IncomingMessage, response: ServerResponse) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendError(response, 405, 'Method not allowed');
    return;
  }
  const filePath = safePath(request.url || '/');
  if (filePath === null) {
    sendError(response, 403, 'Forbidden');
    return;
  }
  let target = filePath;
  try {
    const stat = statSync(target);
    if (stat.isDirectory()) target = join(target, 'index.html');
  } catch {
    sendError(response, 404, 'Not found');
    return;
  }
  let size: number;
  try {
    size = statSync(target).size;
  } catch {
    sendError(response, 404, 'Not found');
    return;
  }
  const type = CONTENT_TYPES[extname(target).toLowerCase()] || 'application/octet-stream';
  response.writeHead(200, { 'content-type': type, 'content-length': size });
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  const stream = createReadStream(target);
  stream.on('error', () => {
    if (!response.headersSent) sendError(response, 500, 'Read failed');
    else response.destroy();
  });
  stream.pipe(response);
});

server.listen(port, () => {
  console.log('Leonida Trophy Guide at http://localhost:' + port + '/');
});
