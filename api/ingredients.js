// api/ingredients.js
import fetch from "node-fetch";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID_ING = process.env.NOTION_DB_ING;

// cache simple 5 min
let cache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000;

export default async function handler(req, res) {
  try {
    const now = Date.now();
    if (cache && now - cacheTimestamp < CACHE_DURATION) {
      return res.status(200).json({ results: cache });
    }

    const notionRes = await fetch(
      `https://api.notion.com/v1/databases/${DATABASE_ID_ING}/query`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ page_size: 500 })
      }
    );

    const data = await notionRes.json();
    if (!data.results) {
      return res.status(500).json({ error: "Pas de résultats Notion" });
    }

    // on map juste nom + icône
    const ingredients = data.results.map(page => ({
      id: page.id,
      name: page.properties.Nom.title[0]?.plain_text || "Sans nom",
      icon: page.icon || null
    }));

    cache = ingredients;
    cacheTimestamp = now;

    return res.status(200).json({ results: ingredients });

  } catch (err) {
    console.error("Erreur API /ingredients :", err);
    return res.status(500).json({ error: err.message });
  }
}
