import { GoogleGenAI, Type } from "@google/genai";
import { ParsedTransaction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Debug log for API Key presence (do not log the actual key)
if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not defined in the environment. AI parsing will fail.");
} else {
  console.log("GEMINI_API_KEY is detected.");
}

export async function parseTransaction(text: string): Promise<ParsedTransaction | null> {
  if (!ai) {
    console.error("Gemini API Key is missing. Please set GEMINI_API_KEY in environment variables.");
    return null;
  }
  
  console.log("Parsing text with Gemini:", text);
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse the following financial transaction text into JSON: "${text}"`,
      config: {
        systemInstruction: `You are a financial assistant. Extract the amount, type (income or expense), category, and note from the text. 
        If the type is not clear, default to 'expense'. 
        If the category is not clear, use '其他'. 
        Clean the note and category by removing redundant amount information.
        Current date is ${new Date().toISOString()}.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            type: { type: Type.STRING, enum: ["income", "expense"] },
            category: { type: Type.STRING },
            note: { type: Type.STRING }
          },
          required: ["amount", "type", "category", "note"]
        }
      }
    });

    const responseText = response.text;
    console.log("Gemini response:", responseText);
    
    if (!responseText) return null;
    
    const parsed = JSON.parse(responseText.trim());
    return parsed as ParsedTransaction;
  } catch (error) {
    console.error("Failed to parse transaction with Gemini:", error);
    return null;
  }
}
