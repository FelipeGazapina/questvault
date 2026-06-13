// Minimal MCP stdio bridge for the Pencil desktop app.
// Usage:
//   node pencil-mcp.mjs list
//   node pencil-mcpmjs call <tool> '<json-args>'
//   node pencil-mcp.mjs call <tool> @args.json
// Image content in results is saved to design/shots/ and replaced with the file path.
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const EXE = 'C:\\Users\\lipir\\AppData\\Local\\Programs\\Pencil\\resources\\app.asar.unpacked\\out\\mcp-server-windows-x64.exe';
const [, , mode, toolName, rawArgs] = process.argv;

const child = spawn(EXE, ['--app', 'desktop'], { stdio: ['pipe', 'pipe', 'pipe'] });
let stderr = '';
child.stderr.on('data', d => { stderr += d; });

const timeout = setTimeout(() => {
  console.error('TIMEOUT after 120s. stderr:', stderr.slice(-2000));
  child.kill();
  process.exit(2);
}, 120000);

let buf = '';
const pending = new Map();
let nextId = 1;
const send = obj => child.stdin.write(JSON.stringify(obj) + '\n');
const req = (method, params) => new Promise((res, rej) => {
  const id = nextId++;
  pending.set(id, { res, rej });
  send({ jsonrpc: '2.0', id, method, params });
});
child.stdout.on('data', d => {
  buf += d.toString('utf8');
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i); buf = buf.slice(i + 1);
    if (!line.trim()) continue;
    let msg; try { msg = JSON.parse(line); } catch { continue; }
    if (msg.id !== undefined && pending.has(msg.id)) {
      const p = pending.get(msg.id); pending.delete(msg.id);
      msg.error ? p.rej(new Error(JSON.stringify(msg.error))) : p.res(msg.result);
    }
  }
});
child.on('exit', code => {
  if (pending.size) { console.error(`server exited (${code}) early. stderr:`, stderr.slice(-2000)); process.exit(3); }
});

try {
  await req('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'claude-bridge', version: '1.0.0' },
  });
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });

  if (mode === 'list') {
    const r = await req('tools/list', {});
    console.log(JSON.stringify(r.tools?.map(t => t.name) ?? r, null, 2));
  } else if (mode === 'call') {
    let args = {};
    if (rawArgs) {
      if (rawArgs.startsWith('@') && rawArgs.endsWith('.js')) {
        args = { input: readFileSync(join(here, rawArgs.slice(1)), 'utf8') };
      } else {
        args = JSON.parse(rawArgs.startsWith('@') ? readFileSync(join(here, rawArgs.slice(1)), 'utf8') : rawArgs);
      }
    }
    const r = await req('tools/call', { name: toolName, arguments: args });
    for (const c of r.content ?? []) {
      if (c.type === 'image' && c.data) {
        mkdirSync(join(here, 'shots'), { recursive: true });
        const f = join(here, 'shots', `shot-${Date.now()}.png`);
        writeFileSync(f, Buffer.from(c.data, 'base64'));
        c.data = `(saved: ${f})`;
      }
    }
    console.log(JSON.stringify(r, null, 2));
  } else {
    console.error('usage: node pencil-mcp.mjs list | call <tool> <json|@file>');
    process.exit(1);
  }
} catch (e) {
  console.error('ERROR:', e.message, '\nstderr:', stderr.slice(-2000));
  process.exit(1);
} finally {
  clearTimeout(timeout);
  child.kill();
}
