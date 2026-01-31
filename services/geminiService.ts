
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

export const getGeminiChat = () => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are the AI Concierge for "Lumina IT", a premium white-themed IT services agency. 
      Lumina specializes in cloud architecture, cybersecurity, AI integration, and bespoke enterprise software.
      Your tone is sophisticated, professional, helpful, and concise. 
      Offer to schedule consultations or explain services like:
      1. Cloud Migration & Strategy
      2. AI-Driven Automation
      3. Cybersecurity Fortification
      4. Bespoke Enterprise Portals.
      Maintain the premium 'flowy' and high-end feel in your language.`,
      temperature: 0.7,
    },
  });
};

export const sendMessageToGemini = async (chat: any, message: string) => {
  try {
    const response: GenerateContentResponse = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I apologize, but I am currently processing a high volume of requests. How else may I assist you with Lumina IT's services?";
  }
};
