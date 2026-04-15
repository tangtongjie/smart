import { GoogleGenAI, Type } from "@google/genai";
import { ParsedTransaction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function parseTransaction(text: string): Promise<ParsedTransaction | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse the following financial transaction text into JSON: "${text}"`,
      config: {
        systemInstruction: `You are a financial assistant. Extract the amount, type (income or expense), category, and note from the text. 
        If the type is not clear, default to 'expense'. 
        If the category is not clear, use 'Other'. 
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

    const result = JSON.parse(response.text || "{}");
    return result as ParsedTransaction;
  } catch (error) {
    console.error("Failed to parse transaction:", error);
    return null;
  }
}
