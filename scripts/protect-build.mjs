import fs from "node:fs";
import path from "node:path";
import JavaScriptObfuscator from "javascript-obfuscator";

const dist = path.resolve("dist");
if (!fs.existsSync(dist)) {
  throw new Error("dist/ does not exist. Run the Vite build first.");
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

const jsFiles = walk(dist).filter((file) => file.endsWith(".js"));

for (const file of jsFiles) {
  const source = fs.readFileSync(file, "utf8");

  const result = JavaScriptObfuscator.obfuscate(source, {
    compact: true,
    simplify: true,
    identifierNamesGenerator: "hexadecimal",
    renameGlobals: false,

    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ["base64"],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayThreshold: 0.78,
    splitStrings: true,
    splitStringsChunkLength: 8,

    numbersToExpressions: true,
    transformObjectKeys: true,
    unicodeEscapeSequence: false,

    // Deliberately disabled because they commonly cause runtime/performance problems:
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    selfDefending: false,

    sourceMap: false
  });

  fs.writeFileSync(file, result.getObfuscatedCode(), "utf8");
  console.log(`Protected ${path.relative(process.cwd(), file)}`);
}

fs.writeFileSync(path.join(dist, ".nojekyll"), "", "utf8");
