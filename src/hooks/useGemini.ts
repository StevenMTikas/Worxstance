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
const MODEL_NAME = 'gemini-1.5-flash'; // Fallback to stable if preview unavailable, or user specific 'gemini-2.5-flash-preview-09-2025'

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

      if (responseSchema) {
        generationConfig.responseMimeType = "application/json";
        generationConfig.responseSchema = responseSchema;
      }

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig
      });

      const response = result.response;
      const text = response.text();

      if (responseSchema) {
        // Parse JSON if schema was requested
        try {
          return JSON.parse(text) as T;
        } catch (e) {
          console.error('Failed to parse Gemini JSON response:', e);
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
