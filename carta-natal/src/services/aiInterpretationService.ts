import type { AstroEntity } from '../types';

const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

/**
 * Build a contextual prompt string based on entity type.
 */
function buildEntityPrompt(entity: AstroEntity): string {
  switch (entity.type) {
    case 'planet':
      return `Interpreta: El planeta ${entity.name} está en el signo de ${entity.sign ?? 'desconocido'} en la Casa ${entity.house ?? '?'}.`;
    case 'house':
      return `Interpreta: La Casa ${entity.name} tiene su cúspide en el signo de ${entity.sign ?? 'desconocido'}. Explica qué área de vida gobierna esta casa y cómo se manifiesta en ese signo.`;
    case 'angle':
      return `Interpreta: El ${entity.name} se encuentra en el signo de ${entity.sign ?? 'desconocido'}. Explica el significado profundo de este ángulo astrológico en este signo para la carta natal.`;
    default:
      return `Interpreta la posición astrológica de ${entity.name} en ${entity.sign ?? 'un signo'}.`;
  }
}

/**
 * Build a human-readable fallback label for error messages.
 */
function buildEntityLabel(entity: AstroEntity): string {
  if (entity.sign) return `**${entity.name}** en **${entity.sign}**`;
  return `**${entity.name}**`;
}

/**
 * Generic entity interpretation via OpenRouter.
 */
export async function getEntityInterpretation(entity: AstroEntity): Promise<string> {
  const label = buildEntityLabel(entity);

  if (!apiKey) {
    return `*La carta está clara para ${label}.*\n\nSin embargo, la conexión celestial está interrumpida en este momento. La IA no está conectada (Falta la API Key).`;
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
            content: buildEntityPrompt(entity)
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
    return `*Los astros guardan silencio sobre ${label} en este preciso instante.*\n\nHubo un problema de conexión temporal o error en la IA al intentar interpretar tu carta.`;
  }
}

/**
 * Backward-compatible wrapper (legacy callers).
 */
export async function getPlanetInterpretation(planetName: string, sign: string, house: number): Promise<string> {
  return getEntityInterpretation({
    type: 'planet',
    name: planetName,
    sign: sign as any,
    house,
  });
}
