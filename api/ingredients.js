// api/ingredients.js
import fetch from "node-fetch";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID_ING = process.env.NOTION_DB_ING;

// cache simple 5 min
let cache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000;

async function queryNotionDatabase() {
  let allResults = [];
  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
    const body = startCursor ? { start_cursor: startCursor, page_size: 100 } : { page_size: 100 };

    const res = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID_ING}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Erreur Notion API : ${res.status} ${text}`);
    }

    const data = await res.json();
    allResults = allResults.concat(data.results);
    hasMore = data.has_more;
    startCursor = data.next_cursor;
  }

  return allResults;
}

export default async function handler(req, res) {
  try {
    const now = Date.now();
    if (cache && now - cacheTimestamp < CACHE_DURATION) {
      return res.status(200).json({ results: cache });
    }

    const data = await queryNotionDatabase();

    if (!data || !data.length) {
      return res.status(500).json({ error: "Pas de résultats Notion" });
    }

const ingredients = data.map(page => ({
  id: page.id,
  name: page.properties?.Nom?.title?.[0]?.plain_text || "Sans nom",
  icon: page.icon || null,
  lieu: page.properties?.Lieu?.select?.name || null // <-- ajout du lieu
}));


    cache = ingredients;
    cacheTimestamp = now;

    return res.status(200).json({ results: ingredients });
  } catch (err) {
    console.error("Erreur API /ingredients :", err);
    return res.status(500).json({ error: err.message });
  }
}
