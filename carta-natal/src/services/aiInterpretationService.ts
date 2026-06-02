import type { AstroEntity } from '../types';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const openrouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

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

const systemPrompt = "Eres un astrólogo humano, místico y muy empático. RESPONDE SIEMPRE EN ESPAÑOL. Analiza la posición astrológica que te da el usuario. Tu respuesta debe tener MÁXIMO 2 párrafos cortos. Háblale directamente al usuario con un tono cálido y revelador. Usa negritas para las palabras clave. NUNCA suenes como un robot.";

/**
 * Call Gemini API directly.
 */
async function callGeminiAPI(prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiApiKey}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      systemInstruction: {
        parts: [{
          text: systemPrompt
        }]
      },
      generationConfig: {
        temperature: 0.7
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gemini API Error Status: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("No text returned from Gemini API");
  }
  return text;
}

/**
 * Call OpenRouter API.
 */
async function callOpenRouterAPI(prompt: string): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openrouterApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openrouter/free",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenRouter API Error Status: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("No text returned from OpenRouter API");
  }
  return text;
}

/**
 * Generic entity interpretation via Gemini (Primary) and OpenRouter (Fallback).
 */
export async function getEntityInterpretation(entity: AstroEntity): Promise<string> {
  const label = buildEntityLabel(entity);
  const prompt = buildEntityPrompt(entity);

  // 1. Try Gemini
  if (geminiApiKey) {
    try {
      console.log(`🤖 Intentando interpretación con Gemini para ${entity.name}...`);
      const interpretation = await callGeminiAPI(prompt);
      return interpretation;
    } catch (error) {
      console.warn("⚠️ Falló Gemini, intentando fallback con OpenRouter...", error);
    }
  }

  // 2. Try OpenRouter (Fallback)
  if (openrouterApiKey) {
    try {
      console.log(`🤖 Intentando interpretación con OpenRouter para ${entity.name}...`);
      const interpretation = await callOpenRouterAPI(prompt);
      return interpretation;
    } catch (error) {
      console.error("🔴 Fallaron ambos proveedores (Gemini y OpenRouter):", error);
    }
  }

  // 3. Complete Fallback (when no keys are configured or both calls fail)
  if (!geminiApiKey && !openrouterApiKey) {
    return `*La carta está clara para ${label}.*\n\nSin embargo, la conexión celestial está interrumpida en este momento. La IA no está conectada (Faltan las API Keys en el archivo .env).`;
  }

  return `*Los astros guardan silencio sobre ${label} en este preciso instante.*\n\nHubo un problema de conexión temporal o error en la IA al intentar interpretar tu carta.`;
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
