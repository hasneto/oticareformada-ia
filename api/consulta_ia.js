// api/consulta_ia.js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // chave fica segura no Vercel
});

// Simulação de conteúdo do blog
const posts = [
  `A ótica reformada defende que a salvação é unicamente pela graça de Deus, conforme as doutrinas da Reforma Protestante.`,
  `A Bíblia é a única regra de fé e prática, e toda autoridade humana deve ser submetida à Palavra de Deus.`,
  `A igreja reformada histórica valoriza a confissão pública de fé, o culto reverente e a centralidade da pregação expositiva.`,
  `O site Ótica Reformada publica artigos teológicos, estudos bíblicos e reflexões sobre a fé cristã reformada.`
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { pergunta } = req.body;
  if (!pergunta) return res.status(400).json({ error: "Pergunta não enviada" });

  try {
    const contexto = posts.join("\n\n");

    const mensagemSistema = `
Você é o assistente oficial do site Ótica Reformada.
Responda APENAS com base neste conteúdo:
${contexto}
Se não souber, diga que não há informação suficiente nas postagens.
`;

    const resposta = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: mensagemSistema },
        { role: "user", content: pergunta }
      ],
      temperature: 0.3
    });

    const texto = resposta.choices[0].message.content;
    res.status(200).json({ resposta: texto });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

