import fetch from "node-fetch";

const RSS_URL = "https://www.oticareformada.com/feeds/posts/default?alt=json&max-results=500";
const GROQ_API_KEY = process.env.GROQ_API_KEY;

export default async function handler(req, res) {
  // --- CORS ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { pergunta } = req.body;
  if (!pergunta) return res.status(400).json({ error: "Pergunta não enviada" });

  try {
    // --- Buscar posts do Blogger ---
    const response = await fetch(RSS_URL);
    const data = await response.json();

    // Extrair título e conteúdo dos posts
    const posts = data.feed.entry?.map(entry => {
      const title = entry.title?.$t || "";
      const content = entry.content?.$t || entry.summary?.$t || "";
      return `${title}\n${content}`;
    }) || [];

    const contexto = posts.join("\n\n");

    const mensagemSistema = `
Você é o assistente oficial do site Ótica Reformada.
Responda APENAS com base neste conteúdo extraído do blog:
${contexto}
Se não souber, diga que não há informação suficiente nas postagens.
`;

    // --- Enviar para o modelo da Groq ---
    const resposta = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [
          { role: "system", content: mensagemSistema },
          { role: "user", content: pergunta }
        ],
        temperature: 0.3
      })
    });

    const json = await resposta.json();
    const texto = json.choices?.[0]?.message?.content || "Sem resposta da IA.";
    res.status(200).json({ resposta: texto });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

