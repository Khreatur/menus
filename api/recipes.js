import fetch from "node-fetch";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DB;

export default async function handler(req, res) {
  try {
    console.log("DATABASE_ID:", process.env.NOTION_DB);
    console.log("NOTION_TOKEN:", process.env.NOTION_TOKEN ? "OK" : "MISSING");

    const response = await fetch(`https://api.notion.com/v1/databases/${process.env.NOTION_DB}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Notion API error:", text);
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (err) {
    console.error("Serverless error:", err);
    res.status(500).json({ error: err.message });
  }
}

