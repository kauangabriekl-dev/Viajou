// Banco H2 local do VIAJOU (modo PostgreSQL), acessado pelo driver `pg`.
//
//   npm run db:start     sobe o servidor H2 (deixe rodando num terminal)
//   npm run db:migrate   aplica as migrations novas de db/migrations
//   npm run db:seed      critérios de avaliação + destinos/lugares de demonstração (só local)
//   npm run db:status    migrations aplicadas e contagem das tabelas principais
//   node scripts/db.mjs admin <username>    dá acesso à moderação (/moderacao); --remover tira
//   node scripts/db.mjs reset --confirmar   APAGA todo o banco local (pede confirmação explícita)
//
// Configuração (opcional, no ambiente ou .env.local): DB_HOST, DB_PORT, DB_NAME, DB_USER,
// DB_PASSWORD e JAVA_HOME. Sem JAVA_HOME, usa o JDK portátil em ../tools/jdk-21 ou o java do PATH.
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { toPostgres } from "./sql-dialect.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, ".data");
const H2_VERSION = "2.5.252";
const H2_SHA1 = "993ba74eafa574df15f4809f8082a12f67cad34b";
const H2_JAR = join(DATA, "h2", `h2-${H2_VERSION}.jar`);

// .env.local (só as chaves DB_* e JAVA_HOME), sem sobrescrever o ambiente.
const envFile = join(ROOT, ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*((?:DB_[A-Z_]+)|JAVA_HOME)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

// DATABASE_URL (Postgres gerenciado) tem prioridade; sem ela, H2 local pelos DB_*.
const config = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false },
      host: new URL(process.env.DATABASE_URL).hostname,
      port: Number(new URL(process.env.DATABASE_URL).port || 5432),
      database: new URL(process.env.DATABASE_URL).pathname.slice(1),
    }
  : {
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 5435),
      database: process.env.DB_NAME || "viajou",
      user: process.env.DB_USER || "viajou",
      password: process.env.DB_PASSWORD || "viajou",
    };

// Datas (DATE) voltam como texto "AAAA-MM-DD": sem conversão para o fuso local.
pg.types.setTypeParser(1082, (value) => value);

function findJava() {
  const candidates = [
    process.env.JAVA_HOME && join(process.env.JAVA_HOME, "bin", "java"),
    join(ROOT, "..", "tools", "jdk-21", "bin", "java"),
    "java",
  ].filter(Boolean);
  for (const java of candidates) {
    const probe = spawnSync(java, ["-version"], { encoding: "utf8" });
    if (!probe.error && probe.status === 0)
      return { java, version: probe.stderr.split("\n")[0].trim() };
  }
  throw new Error("Java 17+ não encontrado. Defina JAVA_HOME ou coloque o JDK em ../tools/jdk-21.");
}

async function ensureJar() {
  if (existsSync(H2_JAR)) return;
  mkdirSync(dirname(H2_JAR), { recursive: true });
  const url = `https://repo1.maven.org/maven2/com/h2database/h2/${H2_VERSION}/h2-${H2_VERSION}.jar`;
  console.log(`Baixando H2 ${H2_VERSION} do Maven Central…`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao baixar o H2: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const sha1 = createHash("sha1").update(buf).digest("hex");
  if (sha1 !== H2_SHA1) throw new Error(`SHA-1 do H2 não confere (${sha1}). Arquivo descartado.`);
  writeFileSync(H2_JAR, buf);
}

async function connect() {
  const client = new pg.Client(config);
  client.on("error", (err) => console.error("Conexão perdida:", err.message));
  try {
    await client.connect();
  } catch (err) {
    throw new Error(
      `Não consegui conectar em ${config.host}:${config.port}. O servidor está rodando? (npm run db:start)\n${err.message}`,
    );
  }
  return client;
}

/** Divide um arquivo SQL em comandos (os arquivos do projeto não têm ";" dentro de textos). */
function statements(sql) {
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function runFile(client, file) {
  const sql = readFileSync(file, "utf8");
  for (const statement of statements(process.env.DATABASE_URL ? toPostgres(sql) : sql)) {
    try {
      await client.query(statement);
    } catch (err) {
      err.message = `${err.message}\n--- comando que falhou (${file}):\n${statement.slice(0, 400)}`;
      throw err;
    }
  }
}

const commands = {
  async start() {
    const { java, version } = findJava();
    await ensureJar();
    mkdirSync(join(DATA, "db"), { recursive: true });
    console.log(`Java: ${version}\nH2:   ${H2_VERSION}\nDados: ${join(DATA, "db")}`);
    // -Xmx256m: o H2 local precisa de pouca memória. Sem -pgAllowOthers: só conexões desta máquina.
    const server = spawn(
      java,
      [
        "-Xmx256m",
        "-cp",
        H2_JAR,
        "org.h2.tools.Server",
        "-pg",
        "-pgPort",
        String(config.port),
        "-baseDir",
        join(DATA, "db"),
        "-ifNotExists",
      ],
      { stdio: "inherit" },
    );
    const stop = () => server.kill();
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);
    await new Promise((resolveExit) => server.on("exit", resolveExit));
  },

  async migrate() {
    const client = await connect();
    try {
      await client.query(
        "CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(255) PRIMARY KEY, applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL)",
      );
      const applied = new Set(
        (await client.query("SELECT version FROM schema_migrations")).rows.map((r) => r.version),
      );
      const dir = join(ROOT, "db", "migrations");
      const pending = readdirSync(dir)
        .filter((f) => f.endsWith(".sql") && !applied.has(f))
        .sort();
      if (!pending.length) return console.log("Nenhuma migration pendente.");
      for (const file of pending) {
        // No H2, comandos DDL se confirmam sozinhos: se uma migration falhar no meio,
        // corrija o arquivo e recrie o banco local com `reset --confirmar`.
        await runFile(client, join(dir, file));
        await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file]);
        console.log(`aplicada: ${file}`);
      }
    } finally {
      await client.end();
    }
  },

  async seed(args) {
    const noDemo = args.includes("--sem-demo");
    if (process.env.NODE_ENV === "production" && !noDemo) {
      throw new Error("Dados de demonstração nunca vão para produção. Use --sem-demo.");
    }
    const client = await connect();
    try {
      const dir = join(ROOT, "db", "seed");
      for (const file of readdirSync(dir)
        .filter((f) => f.endsWith(".sql"))
        .sort()) {
        if (noDemo && file.includes("demo")) continue;
        await runFile(client, join(dir, file));
        console.log(`seed: ${file}`);
      }
    } finally {
      await client.end();
    }
  },

  async admin(args) {
    const username = args.find((a) => !a.startsWith("--"));
    if (!username) throw new Error("Uso: node scripts/db.mjs admin <username> [--remover]");
    const remove = args.includes("--remover");
    const client = await connect();
    try {
      const res = await client.query("UPDATE profiles SET is_admin = $1 WHERE username = $2", [
        !remove,
        username.replace(/^@/, ""),
      ]);
      if (!res.rowCount) throw new Error(`Usuário @${username} não encontrado.`);
      console.log(
        remove ? `@${username} não é mais administrador.` : `@${username} agora é administrador.`,
      );
    } finally {
      await client.end();
    }
  },

  async status() {
    const client = await connect();
    try {
      const migrations = await client
        .query("SELECT version, applied_at FROM schema_migrations ORDER BY version")
        .catch(() => ({ rows: [] }));
      console.log(`Banco: ${config.database} em ${config.host}:${config.port}`);
      console.log(
        `Migrations aplicadas: ${migrations.rows.map((r) => r.version).join(", ") || "(nenhuma)"}`,
      );
      const tables = (
        await client.query(
          "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name",
        )
      ).rows.map((r) => r.table_name);
      console.log(`Tabelas: ${tables.length}`);
      for (const t of [
        "users",
        "profiles",
        "destinations",
        "places",
        "review_categories",
        "place_categories",
        "reviews",
        "posts",
      ]) {
        if (!tables.includes(t)) continue;
        const { rows } = await client.query(`SELECT COUNT(*) AS n FROM ${t}`);
        console.log(`  ${t.padEnd(18)} ${rows[0].n}`);
      }
    } finally {
      await client.end();
    }
  },

  async reset(args) {
    if (!args.includes("--confirmar")) {
      throw new Error("Isso apaga TODOS os dados do banco H2 local. Rode de novo com --confirmar.");
    }
    const client = await connect();
    try {
      await client.query("DROP ALL OBJECTS");
      console.log("Banco local apagado. Rode db:migrate e db:seed.");
    } finally {
      await client.end();
    }
  },
};

const [command = "status", ...args] = process.argv.slice(2);
if (!commands[command]) {
  console.error(`Comando desconhecido: ${command}. Use: ${Object.keys(commands).join(", ")}`);
  process.exit(1);
}
commands[command](args).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
