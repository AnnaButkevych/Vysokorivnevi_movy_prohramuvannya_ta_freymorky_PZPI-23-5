import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const data = {
  title: "PZ2 JSON Generator",
  author: "Student",
  level: 2,
  createdAt: new Date().toISOString(),
  items: [
    { id: 1, name: "Weather demo" },
    { id: 2, name: "JSON export" },
    { id: 3, name: "Movie tracker" },
  ],
};

const outputPath = resolve("generated-data.json");
const jsonText = JSON.stringify(data, null, 2);

writeFileSync(outputPath, jsonText, "utf8");

console.log(`JSON file created: ${outputPath}`);
