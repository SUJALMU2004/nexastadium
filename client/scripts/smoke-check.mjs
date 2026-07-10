import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const clientRoot = resolve(scriptDirectory, "..");
const projectRoot = resolve(clientRoot, "..");
const failures = [];

/**
 * Read a UTF-8 text file relative to the repository root.
 *
 * @param {string} relativePath - Repository-relative file path.
 * @returns {string} File contents or an empty string when missing.
 */
function readProjectFile(relativePath) {
  const absolutePath = join(projectRoot, relativePath);
  return existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : "";
}

/**
 * Record a failed smoke-check assertion.
 *
 * @param {boolean} condition - Assertion condition.
 * @param {string} message - Human-readable failure message.
 * @returns {void}
 */
function assertSmokeCheck(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

/**
 * List repository-relative source files under client/src.
 *
 * @param {string} currentDirectory - Absolute directory to scan.
 * @returns {string[]} Repository-relative source file paths.
 */
function listClientSourceFiles(currentDirectory) {
  return readdirSync(currentDirectory).flatMap((directoryEntry) => {
    const absoluteEntryPath = join(currentDirectory, directoryEntry);
    const entryStats = statSync(absoluteEntryPath);
    if (entryStats.isDirectory()) {
      return listClientSourceFiles(absoluteEntryPath);
    }
    return [relative(projectRoot, absoluteEntryPath).replaceAll("\\", "/")];
  });
}

const vercelConfig = JSON.parse(readProjectFile("client/vercel.json"));
const appSource = readProjectFile("client/src/App.jsx");
const navbarSource = readProjectFile("client/src/components/common/Navbar.jsx");
const i18nSource = readProjectFile("client/src/i18n.js");
const indexCssSource = readProjectFile("client/src/index.css");
const languageSwitcherSource = readProjectFile("client/src/components/common/LanguageSwitcher.jsx");
const loadingSpinnerSource = readProjectFile("client/src/components/common/LoadingSpinner.jsx");
const pageHeaderSource = readProjectFile("client/src/components/common/PageHeader.jsx");
const clientEnvExampleSource = readProjectFile("client/.env.example");

const hasSpaRewrite = Array.isArray(vercelConfig.rewrites)
  && vercelConfig.rewrites.some((rewriteRule) => rewriteRule.source === "/(.*)" && rewriteRule.destination === "/index.html");

assertSmokeCheck(hasSpaRewrite, "client/vercel.json must rewrite SPA routes to /index.html.");

[
  "/",
  "/fan",
  "/fan/assistant",
  "/fan/navigator",
  "/fan/trip-planner",
  "/fan/accessibility",
  "/fan/safety-guide",
  "/ops",
  "/ops/incidents",
  "/ops/announcements",
  "/ops/sustainability",
  "/ops/simulator",
  "/ops/briefing",
  "/ops/reports",
  "/transit",
  "/transit/egress",
  "/transit/routes",
  "/transit/alerts",
  "/transit/flow-control"
].forEach((routePath) => {
  assertSmokeCheck(appSource.includes(`path="${routePath}"`), `App route ${routePath} is missing.`);
});

const removedReadinessRoute = "/demo" + "/readiness";
assertSmokeCheck(!appSource.includes(removedReadinessRoute), "Public readiness-check route must not be registered.");

[
  `client/src/pages/demo/Demo${"Readiness"}.jsx`,
  `client/src/services/readiness${"Service"}.js`,
  `client/src/components/common/${"Readiness"}Checklist.jsx`
].forEach((relativePath) => {
  assertSmokeCheck(!existsSync(join(projectRoot, relativePath)), `${relativePath} must remain absent.`);
});

const clientSourceFiles = listClientSourceFiles(join(clientRoot, "src"));
const scannedFrontendText = clientSourceFiles
  .map((relativeSourcePath) => readProjectFile(relativeSourcePath))
  .join("\n");
const frontendForbiddenMarkers = [
  `OPENROUTER_${"API_KEY"}`,
  `VITE_OPENROUTER_${"API_KEY"}`,
  `openrouter${".ai"}`,
  `dangerously${"SetInnerHTML"}`
];

frontendForbiddenMarkers.forEach((forbiddenMarker) => {
  assertSmokeCheck(!scannedFrontendText.includes(forbiddenMarker), `Frontend source must not contain ${forbiddenMarker}.`);
  assertSmokeCheck(!clientEnvExampleSource.includes(forbiddenMarker), `client/.env.example must not contain ${forbiddenMarker}.`);
});

assertSmokeCheck(navbarSource.includes('href="#main-content"'), "Navbar skip link must target #main-content.");
assertSmokeCheck(appSource.includes('id="main-content"'), "App shell must expose main-content target.");
assertSmokeCheck(i18nSource.includes("document.documentElement.dir"), "i18n must update document direction for RTL support.");
assertSmokeCheck(indexCssSource.includes(":focus-visible"), "Global focus-visible styling must exist.");
assertSmokeCheck(languageSwitcherSource.includes("<select"), "Language switcher must use a native select.");
assertSmokeCheck(loadingSpinnerSource.includes('role="status"'), "Loading spinner must expose role=status.");
assertSmokeCheck(pageHeaderSource.includes("<h1"), "PageHeader must render semantic h1 headings.");

if (failures.length) {
  console.error("NexaStadium frontend smoke checks failed:");
  failures.forEach((failureMessage) => console.error(`- ${failureMessage}`));
  process.exit(1);
}

console.log("NexaStadium frontend smoke checks passed.");
