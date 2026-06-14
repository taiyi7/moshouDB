const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const jsonPath = path.join(root, "timewow-biaoge-equipment.json");
const jsPath = path.join(root, "timewow-biaoge-equipment-data.js");

const json = fs.readFileSync(jsonPath, "utf8");
JSON.parse(json);

fs.writeFileSync(
  jsPath,
  `window.TIMEWOW_BIAOGE_EQUIPMENT = ${json};\n`,
  "utf8"
);

console.log(JSON.stringify({ input: jsonPath, output: jsPath }, null, 2));
