import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export async function getPlanetInterpretation(planetName: string, sign: string, house: number): Promise<string> {
  if (!genAI || !apiKey) {
    return `*La carta está clara para **${planetName}** en **${sign}** en la Casa **${house}**.*\n\nSin embargo, la conexión celestial está interrumpida en este momento. La IA no está conectada (Falta la API Key).`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Eres un astrólogo experto. El usuario tiene a ${planetName} en ${sign} en la Casa ${house}. Escribe una interpretación reveladora y empática de 2 párrafos en formato Markdown. Usa negritas para destacar conceptos. Ve directo al grano sin introducciones genéricas.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("AI Interpretation Error:", error);
    return `*Los astros guardan silencio sobre **${planetName}** en este preciso instante.*\n\nHubo un problema de conexión temporal o error en la IA al intentar interpretar tu carta.`;
  }
}
