const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

export async function getPlanetInterpretation(planetName: string, sign: string, house: number): Promise<string> {
  if (!apiKey) {
    return `*La carta está clara para **${planetName}** en **${sign}** en la Casa **${house}**.*\n\nSin embargo, la conexión celestial está interrumpida en este momento. La IA no está conectada (Falta la API Key).`;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          {
            role: "system",
            content: "Eres un astrólogo humano, místico y muy empático. RESPONDE SIEMPRE EN ESPAÑOL. Analiza la posición astrológica que te da el usuario. Tu respuesta debe tener MÁXIMO 2 párrafos cortos. Háblale directamente al usuario con un tono cálido y revelador. Usa negritas para las palabras clave. NUNCA suenes como un robot."
          },
          {
            role: "user",
            content: `Interpreta: El planeta ${planetName} está en el signo de ${sign} en la Casa ${house}.`
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `OpenRouter API Error: ${response.status}`);
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error("AI Interpretation Error:", error);
    return `*Los astros guardan silencio sobre **${planetName}** en este preciso instante.*\n\nHubo un problema de conexión temporal o error en la IA al intentar interpretar tu carta.`;
  }
}
