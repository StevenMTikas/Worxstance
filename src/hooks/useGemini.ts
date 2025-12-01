import { 
  GoogleGenerativeAI, 
  GenerativeModel,
  GenerationConfig,
  Tool
} from '@google/generative-ai';
import { useState, useCallback } from 'react';

// Env var for API key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Model constants
const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';

interface GeminiCallOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  responseSchema?: any; // For structured output
  tools?: Tool[]; // For google_search etc
}

interface UseGeminiReturn {
  loading: boolean;
  error: string | null;
  callModel: <T = any>(options: GeminiCallOptions) => Promise<T | null>;
}

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isRetryableError = (error: any): boolean => {
  // Check for rate limit (429) or server errors (503)
  const message = error?.message || '';
  return message.includes('429') || message.includes('503') || message.includes('overloaded');
};

export function useGemini(): UseGeminiReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callModel = useCallback(async <T = any>({
    prompt,
    systemInstruction,
    temperature = 0.7,
    responseSchema,
    tools
  }: GeminiCallOptions): Promise<T | null> => {
    if (!API_KEY) {
      const err = 'VITE_GEMINI_API_KEY is missing in environment variables.';
      console.error(err);
      setError(err);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      
      const modelConfig: any = {
        model: MODEL_NAME,
        systemInstruction
      };

      if (tools) {
        modelConfig.tools = tools;
      }

      const model: GenerativeModel = genAI.getGenerativeModel(modelConfig);

      const generationConfig: GenerationConfig = {
        temperature,
      };

      // IMPORTANT: Gemini API currently throws 400 if tools are present AND responseMimeType is 'application/json'.
      // We must disable strict JSON mode if tools are used and rely on the system instruction/prompt to enforce JSON.
      if (responseSchema) {
        if (tools && tools.length > 0) {
          console.warn("Tools enabled: Disabling strict JSON mode to prevent API conflict. Relying on prompt for JSON structure.");
          // We append strict instructions to ensuring JSON output
          const jsonInstruction = `\n\nIMPORTANT: You must output valid JSON only, adhering to the following schema: ${JSON.stringify(responseSchema)}`;
          
          // Append to system instruction if exists, or create new one (though modelConfig is already created, we can't mutate it easily here without re-init? 
          // Actually getGenerativeModel takes the config. We need to modify the config passed to it.
          
          // Re-constructing systemInstruction:
          modelConfig.systemInstruction = (systemInstruction || '') + jsonInstruction;
          
          // We DO NOT set responseMimeType here.
        } else {
          generationConfig.responseMimeType = "application/json";
          generationConfig.responseSchema = responseSchema;
        }
      }

      // Re-initialize model with potentially updated systemInstruction
      const finalModel: GenerativeModel = genAI.getGenerativeModel(modelConfig);

      let attempt = 0;
      let result = null;

      while (attempt < MAX_RETRIES) {
        try {
          result = await finalModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig
          });
          break; // Success
        } catch (err: any) {
          attempt++;
          if (attempt >= MAX_RETRIES || !isRetryableError(err)) {
            throw err;
          }
          console.warn(`Gemini API error (attempt ${attempt}/${MAX_RETRIES}), retrying...`, err);
          await delay(INITIAL_DELAY_MS * Math.pow(2, attempt - 1));
        }
      }

      if (!result) throw new Error('Failed to generate content after retries');

      const response = result.response;
      let text = response.text();

      if (responseSchema) {
        // Clean up potential markdown code blocks if tools were used (since strict mode was off)
        if (tools && tools.length > 0) {
          text = text.replace(/```json\n?|\n?```/g, '').trim();
        }

        // Parse JSON
        try {
          return JSON.parse(text) as T;
        } catch (e) {
          console.error('Failed to parse Gemini JSON response:', e);
          console.log('Raw text received:', text);
          throw new Error('Invalid JSON response from AI');
        }
      }

      return text as unknown as T;

    } catch (err: any) {
      console.error('Gemini API Error:', err);
      setError(err.message || 'Unknown error occurred calling Gemini');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, callModel };
}
