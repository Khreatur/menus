// api/recipes.js
import fetch from "node-fetch";

const NOTION_TOKEN = process.env.NOTION_TOKEN; 
const DATABASE_ID = process.env.NOTION_DB;


// Cache 5 minutes
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
      `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
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

    // Extraire les données essentielles
    const lightResults = data.results.map(page => {
      // Récupérer les ingrédients agrégés
      const ingredientsRaw = page.properties?.Ingredient_brut?.rollup?.array || [];

      const ingredients = ingredientsRaw.map(i => ({
        id: i.id,
        name: i.title[0]?.plain_text || "Sans nom",
        icon: i.icon || null
      }));

      return {
        id: page.id,
        icon: page.icon || null,
        properties: {
          Nom: page.properties.Nom,
          Categorie: page.properties.Categorie,
          Saison: page.properties.Saison,
          Ingredients: ingredients
        }
      };
    });

    cache = lightResults;
    cacheTimestamp = now;

    return res.status(200).json({ results: lightResults });

  } catch (err) {
    console.error("Erreur API /recipes :", err);
    return res.status(500).json({ error: err.message });
  }
}
