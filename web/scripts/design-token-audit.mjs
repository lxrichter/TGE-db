import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_DIRS = ["app", "components"];
const FILE_EXTENSIONS = new Set([".css", ".ts", ".tsx"]);

const VISUAL_TOKEN_PATTERN =
  /#[0-9a-fA-F]{6}|\b(?:bg|border|text)-(?:white|gray|red|green|amber)(?:-\d{2,3})?\b/g;

function isAllowedMatch(relativePath, line) {
  if (relativePath === "app/globals.css") {
    return true;
  }

  if (line.includes("cssToken(")) {
    return true;
  }

  return false;
}

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)));
      continue;
    }

    if (FILE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  const files = (
    await Promise.all(TARGET_DIRS.map((dir) => listFiles(path.join(ROOT, dir))))
  ).flat();
  const allowed = [];
  const unexpected = [];

  for (const file of files) {
    const relativePath = path.relative(ROOT, file);
    const text = await readFile(file, "utf8");
    const lines = text.split("\n");

    lines.forEach((line, index) => {
      const matches = line.match(VISUAL_TOKEN_PATTERN);

      if (!matches) {
        return;
      }

      const result = {
        file: relativePath,
        line: index + 1,
        matches: [...new Set(matches)],
      };

      if (isAllowedMatch(relativePath, line)) {
        allowed.push(result);
      } else {
        unexpected.push(result);
      }
    });
  }

  const summary = {
    scanned_files: files.length,
    allowed_token_definitions_or_fallbacks: allowed.length,
    unexpected_visual_tokens: unexpected.length,
    unexpected,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (unexpected.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
