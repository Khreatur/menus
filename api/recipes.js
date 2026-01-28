// /api/recipes.js

export default async function handler(req, res) {
  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DATABASE_ID = process.env.NOTION_DB;

  if (!NOTION_TOKEN || !DATABASE_ID) {
    console.error("Variables d'environnement manquantes !");
    return res.status(500).json({ error: "Variables d'environnement manquantes" });
  }

  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json"
        }
      }
    );

    const text = await response.text();

    // Essaie de parser la réponse JSON de Notion
    try {
      const data = JSON.parse(text);
      return res.status(200).json(data);
    } catch (e) {
      console.error("Erreur JSON Notion:", text);
      return res.status(500).json({ error: "Notion a renvoyé une réponse invalide", details: text });
    }

  } catch (err) {
    console.error("Erreur serverless:", err);
    return res.status(500).json({ error: "Erreur interne du serveur", details: err.message });
  }
}
