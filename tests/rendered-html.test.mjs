import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { access, mkdir, readFile, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test, { after, before } from "node:test";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const databaseName = `test-${randomUUID()}.db`;
const databasePath = join(projectRoot, "data", databaseName);
let serverProcess;
let baseUrl;

async function render(pathname = "/") {
  return fetch(baseUrl + pathname, { headers: { accept: "text/html" } });
}

before(async () => {
  await mkdir(join(projectRoot, "data"), { recursive: true });
  const portProbe = createServer();
  await new Promise((resolve) => portProbe.listen(0, "127.0.0.1", resolve));
  const address = portProbe.address();
  assert.ok(address && typeof address === "object");
  const port = address.port;
  await new Promise((resolve, reject) =>
    portProbe.close((error) => (error ? reject(error) : resolve())),
  );

  serverProcess = spawn(
    process.execPath,
    [join(projectRoot, ".output", "server", "index.mjs")],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        HOST: "127.0.0.1",
        PORT: String(port),
        DATABASE_URL: `file:./data/${databaseName}`,
        ADMIN_SETUP_CODES: "local-test-admin-code,local-test-admin-code-2",
        REFEREE_SETUP_CODES:
          "local-test-referee-code,local-test-referee-code-2",
      },
      stdio: "ignore",
    },
  );
  baseUrl = `http://127.0.0.1:${port}`;

  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (serverProcess.exitCode !== null)
      throw new Error(`Test server exited with code ${serverProcess.exitCode}`);
    try {
      const response = await fetch(baseUrl);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      // The listener can take a moment to initialize after the process starts.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, "Nitro test server did not start");
});

after(async () => {
  if (serverProcess && serverProcess.exitCode === null) {
    await new Promise((resolve) => {
      serverProcess.once("exit", resolve);
      serverProcess.kill();
    });
  }
  await rm(databasePath, { force: true });
  await rm(`${databasePath}-wal`, { force: true });
  await rm(`${databasePath}-shm`, { force: true });
});

test("server-renders the finished branded landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /INTERCLASSE/);
  assert.match(html, /LUIZ GONZAGA FLEURY/);
  assert.match(html, /Acessar sistema/i);
  assert.match(html, /aria-label="Aparência e leitura"/i);
  assert.match(html, /Modo claro/i);
  assert.match(html, /Alto contraste/i);
  assert.match(html, /Aumentar texto/i);
  assert.match(html, /logo-escola\.png/);
  assert.match(html, /data-theme="light"/);
  assert.doesNotMatch(
    html,
    /codex-preview|SkeletonPreview|Your site is taking shape/i,
  );
});

test("serves the logo, sports images, and 3D models from the production server", async () => {
  const assets = [
    ["/logo-escola.png", "PNG"],
    ["/images/modalities/futsal.webp", "WEBP"],
    ["/images/modalities/volei.webp", "WEBP"],
    ["/images/modalities/basquete.webp", "WEBP"],
    ["/models/futsal.glb", "glTF"],
    ["/models/basketball.glb", "glTF"],
    ["/models/football.glb", "glTF"],
    ["/models/trophy.glb", "glTF"],
    ["/models/medal.glb", "glTF"],
  ];

  for (const [pathname, signature] of assets) {
    const response = await fetch(`${baseUrl}${pathname}`);
    assert.equal(response.status, 200, `${pathname} should load`);
    if (signature === "PNG" || signature === "WEBP") {
      assert.match(response.headers.get("content-type") ?? "", /^image\//i);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.ok(bytes.length > 100, `${pathname} should not be empty`);
    const actualSignature =
      signature === "PNG"
        ? bytes.subarray(1, 4).toString("ascii")
        : signature === "WEBP"
          ? bytes.subarray(8, 12).toString("ascii")
          : bytes.subarray(0, 4).toString("ascii");
    assert.equal(
      actualSignature,
      signature,
      `${pathname} should have a valid file signature`,
    );
  }
});

test("ships the database, authorization, realtime-control, and social assets", async () => {
  const [schema, setup, control, packageJson] = await Promise.all([
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/setup.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../app/api/matches/control/route.ts", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  for (const table of [
    "users",
    "classes",
    "sports",
    "matches",
    "match_events",
    "sessions",
  ])
    assert.match(setup, new RegExp("CREATE TABLE IF NOT EXISTS " + table));
  assert.match(schema, /role: text\("role"/);
  assert.match(control, /user\.role !== "ADMIN"/);
  assert.match(control, /match\.referee_id === user\.id/);
  assert.match(control, /version = version \+ 1/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await access(new URL("../public/og.png", import.meta.url));
  await assert.rejects(
    access(
      new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url),
    ),
  );
});

test("registers and logs in with accounts persisted in SQLite", async () => {
  const username = `aluno-${randomUUID().slice(0, 8)}`;
  const email = `${username}@escola.test`;
  const password = "senha-de-teste-segura";
  const registration = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      firstName: "Ana",
      lastName: "Teste",
      username,
      email,
      password,
      classId: "3B",
      requestedRole: "STUDENT",
    }),
  });
  assert.equal(registration.status, 201);
  const sessionCookie = registration.headers.get("set-cookie")?.split(";")[0];
  assert.ok(sessionCookie);

  const session = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { cookie: sessionCookie },
  });
  assert.equal(session.status, 200);
  assert.equal((await session.json()).user.username, username);

  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier: email, password }),
  });
  assert.equal(login.status, 200);
  assert.equal((await login.json()).user.classId, "3B");
});

test("creates one-time professor and referee accounts with the expected permissions", async () => {
  async function register({ role, setupCode, prefix }) {
    const username = `${prefix}-${randomUUID().slice(0, 8)}`;
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        firstName: "Conta",
        lastName: "Teste",
        username,
        email: `${username}@escola.test`,
        password: "senha-de-teste-segura",
        requestedRole: role,
        setupCode,
      }),
    });
    return { response, username };
  }

  const teacher = await register({
    role: "ADMIN",
    setupCode: "local-test-admin-code",
    prefix: "professor",
  });
  assert.equal(teacher.response.status, 201);
  const teacherResult = await teacher.response.json();
  assert.equal(teacherResult.user.role, "ADMIN");

  const reusedTeacherCode = await register({
    role: "ADMIN",
    setupCode: "local-test-admin-code",
    prefix: "professor-extra",
  });
  assert.notEqual(reusedTeacherCode.response.status, 201);

  const additionalTeacher = await register({
    role: "ADMIN",
    setupCode: "local-test-admin-code-2",
    prefix: "professor-extra",
  });
  assert.equal(additionalTeacher.response.status, 201);
  assert.equal((await additionalTeacher.response.json()).user.role, "ADMIN");
  const reusedAdditionalTeacherCode = await register({
    role: "ADMIN",
    setupCode: "local-test-admin-code-2",
    prefix: "professor-extra-2",
  });
  assert.equal(reusedAdditionalTeacherCode.response.status, 409);

  const referee = await register({
    role: "REFEREE",
    setupCode: "local-test-referee-code",
    prefix: "arbitro",
  });
  assert.equal(referee.response.status, 201);
  const refereeResult = await referee.response.json();
  assert.equal(refereeResult.user.role, "REFEREE");
  const refereeCookie = referee.response.headers
    .get("set-cookie")
    ?.split(";")[0];
  assert.ok(refereeCookie);

  const reusedRefereeCode = await register({
    role: "REFEREE",
    setupCode: "local-test-referee-code",
    prefix: "arbitro-extra",
  });
  assert.equal(reusedRefereeCode.response.status, 409);

  const additionalReferee = await register({
    role: "REFEREE",
    setupCode: "local-test-referee-code-2",
    prefix: "arbitro-extra",
  });
  assert.equal(additionalReferee.response.status, 201);
  assert.equal((await additionalReferee.response.json()).user.role, "REFEREE");
  const reusedAdditionalRefereeCode = await register({
    role: "REFEREE",
    setupCode: "local-test-referee-code-2",
    prefix: "arbitro-extra-2",
  });
  assert.equal(reusedAdditionalRefereeCode.response.status, 409);

  const creation = await fetch(`${baseUrl}/api/admin`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: refereeCookie,
    },
    body: JSON.stringify({
      action: "createMatch",
      sportId: "futsal",
      homeId: "1A",
      awayId: "1B",
      scheduledAt: "2026-11-10T10:00",
      venue: "Quadra principal",
    }),
  });
  assert.equal(creation.status, 201);
  const { id: matchId } = await creation.json();

  const scoreChange = await fetch(`${baseUrl}/api/matches/control`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: refereeCookie,
    },
    body: JSON.stringify({
      matchId,
      action: "score",
      side: "HOME",
      value: 1,
      type: "Gol",
      clockSeconds: 0,
    }),
  });
  assert.equal(scoreChange.status, 200);

  const dataResponse = await fetch(`${baseUrl}/api/data`, {
    headers: { cookie: refereeCookie },
  });
  const data = await dataResponse.json();
  const createdMatch = data.matches.find((match) => match.id === matchId);
  assert.equal(createdMatch.refereeId, refereeResult.user.id);
  assert.equal(createdMatch.homeScore, 1);
  assert.equal(createdMatch.status, "LIVE");
});
