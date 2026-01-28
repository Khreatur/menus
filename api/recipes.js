// api/recipes.js
import fetch from "node-fetch";

const NOTION_TOKEN = process.env.NOTION_TOKEN; // on met le token dans Vercel
const DATABASE_ID = process.env.NOTION_DB;

// Cache en mémoire (durée 5 minutes)
let cache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default async function handler(req, res) {
  try {
    const now = Date.now();

    if (cache && now - cacheTimestamp < CACHE_DURATION) {
      // Retourne le cache si encore valide
      return res.status(200).json({ results: cache });
    }

    const notionRes = await fetch(
      `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          page_size: 500, // Limite à 100 recettes
          filter: {
            or: [] // tu peux mettre un filtre si besoin
          }
        })
      }
    );

    const data = await notionRes.json();

    if (!data.results) {
      return res.status(500).json({ error: "Pas de résultats Notion" });
    }

    // On ne garde que ce qu'on utilise côté client
    const lightResults = data.results.map(page => ({
      id: page.id,
      icon: page.icon || null,
      properties: {
        Nom: page.properties.Nom,
        Categorie: page.properties.Categorie,
        Ingredients: page.properties.Ingredients
      }
    }));

    // On met à jour le cache
    cache = lightResults;
    cacheTimestamp = now;

    return res.status(200).json({ results: lightResults });

  } catch (err) {
    console.error("Erreur API /recipes :", err);
    return res.status(500).json({ error: err.message });
  }
}
