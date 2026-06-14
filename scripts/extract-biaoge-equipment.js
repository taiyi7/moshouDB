const fs = require("fs");
const path = require("path");

const source = "D:/games/baoxue/gamesdl/World of Warcraft/_classic_titan_/WTF/Account/236843664#1/SavedVariables/BiaoGe.lua";
const destination = path.resolve(__dirname, "..", "timewow-biaoge-equipment.json");
const workspaceRoot = path.resolve(__dirname, "..");

if (!destination.startsWith(workspaceRoot + path.sep)) {
  throw new Error("Refusing to write outside workspace");
}

const text = fs.readFileSync(source, "utf8");
const lines = text.split(/\r?\n/);

const rarityByQuality = {
  1: "普通",
  2: "优秀",
  3: "精良",
  4: "史诗",
  5: "传说"
};

const rarityByColor = {
  ff9d9d9d: "普通",
  ffffffff: "普通",
  ff1eff00: "优秀",
  ff0070dd: "精良",
  ffa335ee: "史诗",
  ffff8000: "传说"
};

const records = [];

for (let i = 0; i < lines.length; i += 1) {
  const line = lines[i];
  if (!line.includes("[\"zhuangbei\"]") || !line.includes("|Hitem:")) continue;

  const block = lines.slice(Math.max(0, i - 18), Math.min(lines.length, i + 24)).join("\n");
  const link = line.match(/\|c([0-9a-fA-F]{8})\|Hitem:([^|]+)\|h\[([^\]]+)\]\|h\|r/);
  if (!link) continue;

  const itemLevel =
    block.match(/\["itemlevel"\]\s*=\s*([0-9]+)/i) ||
    block.match(/\["itemLevel"\]\s*=\s*([0-9]+)/i);
  if (!itemLevel) continue;

  const buyer = block.match(/\["maijia"\]\s*=\s*"([^"]*)"/);
  const realm = block.match(/\["realm"\]\s*=\s*"([^"]*)"/);
  const price = block.match(/\["jine"\]\s*=\s*"([^"]*)"/);
  const time = block.match(/\["time"\]\s*=\s*([0-9]+)/);
  const quality = block.match(/\["quality"\]\s*=\s*([0-9]+)/);

  records.push({
    itemId: link[2].split(":")[0],
    itemString: link[2],
    name: link[3],
    color: link[1].toLowerCase(),
    itemLevel: Number(itemLevel[1]),
    buyer: buyer ? buyer[1] : "",
    realm: realm ? realm[1] : "",
    price: price ? price[1] : "",
    quality: quality ? Number(quality[1]) : null,
    time: time ? Number(time[1]) : null
  });
}

const grouped = new Map();

for (const record of records) {
  const key = `${record.itemId}|${record.name}|${record.itemLevel}`;
  if (!grouped.has(key)) {
    grouped.set(key, {
      ...record,
      count: 0,
      buyers: new Set(),
      realms: new Set(),
      prices: [],
      times: []
    });
  }

  const entry = grouped.get(key);
  entry.count += 1;
  if (record.buyer) entry.buyers.add(record.buyer);
  if (record.realm) entry.realms.add(record.realm);
  if (record.price) entry.prices.push(record.price);
  if (record.time) entry.times.push(record.time);
}

const items = [...grouped.values()]
  .sort((a, b) => b.itemLevel - a.itemLevel || a.name.localeCompare(b.name, "zh-CN"))
  .map((entry) => {
    const buyers = [...entry.buyers];
    const realms = [...entry.realms];
    const prices = entry.prices;

    return {
      id: `biaoge-${entry.itemId}-${entry.itemLevel}`,
      itemId: entry.itemId,
      itemString: entry.itemString,
      name: entry.name,
      slot: "其他",
      rarity: rarityByQuality[entry.quality] || rarityByColor[entry.color] || "史诗",
      itemLevel: entry.itemLevel,
      type: "其他",
      bind: "拾取后绑定",
      unique: false,
      armor: "",
      weapon: "",
      requirements: "需要等级 80",
      primaryStats: [],
      secondaryStats: [],
      sockets: "",
      effects: [],
      description: "",
      sourceType: "团队副本",
      source: realms.filter(Boolean).join("；") || "BiaoGe 团本/拍卖记录",
      dataSource: `BiaoGe.lua 只读抽取：${source}`,
      verified: true,
      notes: [
        `插件记录次数：${entry.count}`,
        buyers.length ? `买家样本：${buyers.slice(0, 5).join("、")}` : "",
        prices.length ? `价格样本：${prices.slice(0, 5).join("、")}` : ""
      ].filter(Boolean).join("；"),
      updatedAt: "2026-06-14",
      _raw: {
        count: entry.count,
        buyers: buyers.slice(0, 20),
        realms,
        prices: prices.slice(0, 20),
        firstTime: entry.times.length ? Math.min(...entry.times) : null,
        lastTime: entry.times.length ? Math.max(...entry.times) : null
      }
    };
  });

const output = {
  name: "泰坦重铸「时光」BiaoGe 插件装备抽取",
  schema: "timewow-verified-equipment-v3",
  extractedAt: new Date().toISOString(),
  source,
  recordCount: records.length,
  itemCount: items.length,
  items
};

fs.writeFileSync(destination, JSON.stringify(output, null, 2), "utf8");

console.log(JSON.stringify({
  source,
  destination,
  recordCount: records.length,
  itemCount: items.length,
  top: items.slice(0, 10).map((item) => ({
    itemId: item.itemId,
    name: item.name,
    itemLevel: item.itemLevel,
    rarity: item.rarity
  }))
}, null, 2));
