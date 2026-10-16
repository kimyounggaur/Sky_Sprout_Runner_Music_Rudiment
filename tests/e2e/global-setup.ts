import http, { type Server } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.join(process.cwd(), 'dist');
const port = 4173;
const host = '127.0.0.1';

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.svg', 'image/svg+xml']
]);

export default async function globalSetup() {
  const server = await startServer();
  return async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  };
}

function startServer(): Promise<Server> {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url ?? '/', `http://${host}:${port}`);
    const requestedPath = decodeURIComponent(url.pathname);
    const relativePath = requestedPath === '/' ? 'index.html' : requestedPath.replace(/^\/+/, '');
    let filePath = path.join(root, path.normalize(relativePath));

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      filePath = path.join(root, 'index.html');
    }

    response.writeHead(200, {
      'Content-Type': contentTypes.get(path.extname(filePath)) ?? 'application/octet-stream'
    });
    createReadStream(filePath).pipe(response);
  });

  return new Promise((resolve) => {
    server.listen(port, host, () => resolve(server));
  });
}
