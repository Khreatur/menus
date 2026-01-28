// api/recipes.js
import fetch from "node-fetch";

const NOTION_TOKEN = process.env.NOTION_TOKEN; // on met le token dans Vercel
const DATABASE_ID = process.env.NOTION_DB;

export default async function handler(req, res) {
  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ page_size: 100 }) // optionnel, limite de lignes
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).send(text);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}
