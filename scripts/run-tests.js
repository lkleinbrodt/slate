const fs = require("fs");
const path = require("path");
const Module = require("module");
const ts = require("typescript");

const projectRoot = path.resolve(__dirname, "..");

const mocks = new Map([
  ["expo-sqlite/kv-store", path.join(projectRoot, "tests/mocks/kv-store.ts")],
  ["expo-crypto", path.join(projectRoot, "tests/mocks/expo-crypto.ts")],
  ["@/lib/db/connection", path.join(projectRoot, "tests/mocks/db-connection.ts")],
  ["@/lib/logic/repo", path.join(projectRoot, "tests/mocks/repo.ts")],
  ["@/lib/logic/dates", path.join(projectRoot, "tests/mocks/dates.ts")],
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
