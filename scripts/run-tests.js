// Newer Node versions strip TypeScript types natively, which bypasses the
// transpile hook below and fails on .ts files inside node_modules. Re-run
// with native stripping disabled.
if (process.features && process.features.typescript && !process.env.SLATE_TEST_CHILD) {
  const { spawnSync } = require("child_process");
  const result = spawnSync(
    process.execPath,
    ["--no-experimental-strip-types", __filename],
    { stdio: "inherit", env: { ...process.env, SLATE_TEST_CHILD: "1" } }
  );
  process.exit(result.status ?? 1);
}

const fs = require("fs");
const path = require("path");
const Module = require("module");
const ts = require("typescript");

const projectRoot = path.resolve(__dirname, "..");

const mocks = new Map([
  ["expo-sqlite/kv-store", path.join(projectRoot, "tests/mocks/kv-store.ts")],
  ["expo-crypto", path.join(projectRoot, "tests/mocks/expo-crypto.ts")],
  ["@/lib/db/connection", path.join(projectRoot, "tests/mocks/db-connection.ts")],
  ["@/lib/services/notifications", path.join(projectRoot, "tests/mocks/notifications.ts")],
  ["expo-notifications", path.join(projectRoot, "tests/mocks/expo-notifications.ts")],
  ["react-native", path.join(projectRoot, "tests/mocks/react-native.ts")],
  // Native voice pieces (Pipecat's WebRTC client, the Keychain); tests pass fakes to the voice store
  ["@/lib/voice/call", path.join(projectRoot, "tests/mocks/voice-call.ts")],
  ["@/lib/voice/secrets", path.join(projectRoot, "tests/mocks/voice-secrets.ts")],
]);

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (mocks.has(request)) {
    const mockedPath = mocks.get(request);
    return originalResolveFilename.call(this, mockedPath, parent, isMain, options);
  }
  if (request.startsWith("@/")) {
    const resolved = path.join(projectRoot, request.slice(2));
    return originalResolveFilename.call(this, resolved, parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require.extensions[".ts"] = function (module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

async function runTest(file) {
  const mod = require(file);
  if (typeof mod.run !== "function") {
    throw new Error(`Test file ${file} must export a run() function`);
  }
  await mod.run();
}

(async () => {
  const testsDir = path.join(projectRoot, "tests");
  if (!fs.existsSync(testsDir)) {
    console.log("No tests directory found. Skipping.");
    return;
  }
  const entries = fs
    .readdirSync(testsDir)
    .filter((file) => file.endsWith(".test.ts"))
    .sort();
  for (const file of entries) {
    const fullPath = path.join(testsDir, file);
    console.log(`Running ${file}...`);
    await runTest(fullPath);
  }
  console.log("All tests passed.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
