import { createServer } from "node:http";

export const FIXTURE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>RRV Verify Controlled Fixture</title>
  </head>
  <body>
    <main>
      <h1>RRV Verify browser fixture</h1>
      <p data-testid="fixture-ready">Local fixture ready</p>
      <button type="button"></button>
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E">
      <p style="color: #aaa; background: #fff">Controlled contrast sample</p>
    </main>
  </body>
</html>`;

export async function startLocalFixture() {
  const server = createServer((request, response) => {
    if (request.url !== "/controlled" || request.method !== "GET") {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; img-src data:; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(FIXTURE_HTML);
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Could not start the controlled local page.");
  }
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    }),
  };
}
