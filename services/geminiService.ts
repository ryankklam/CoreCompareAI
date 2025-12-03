import { GoogleGenAI } from "@google/genai";
import { DataRecord, DiscrepancyReason } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in process.env");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeDiscrepancyWithAI = async (
  oldRecord: DataRecord | undefined,
  newRecord: DataRecord | undefined,
  knownReasons: Record<string, DiscrepancyReason>
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "AI Configuration Missing: API Key not found.";

  const prompt = `
    You are a Senior Core Banking Systems Analyst.
    Compare the following two transaction records (Legacy Core vs. New Core) and explain the discrepancy.
    
    Legacy Record: ${JSON.stringify(oldRecord)}
    New Core Record: ${JSON.stringify(newRecord)}
    
    Known Discrepancy Dictionary:
    ${Object.values(knownReasons).map(r => `- ${r.code}: ${r.label} (${r.description})`).join('\n')}
    
    Task:
    1. Identify the specific fields that differ.
    2. Try to map it to one of the "Known Discrepancy Dictionary" codes if applicable.
    3. If it doesn't fit a known code, explain the functional business reason likely causing this (e.g., end-of-day cut-off time change, fee calculation logic).
    4. Be concise and professional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Unable to generate analysis.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error retrieving AI analysis. Please check your network or API key.";
  }
};

export const generateExecutiveSummary = async (
  stats: any,
  sampleDiscrepancies: any[]
): Promise<string> => {
   const ai = getAiClient();
   if (!ai) return "AI Configuration Missing.";

   const prompt = `
     Generate an executive summary for a Core Banking Migration UAT report.
     
     Statistics:
     ${JSON.stringify(stats)}
     
     Sample of Discrepancies Found:
     ${JSON.stringify(sampleDiscrepancies.slice(0, 5))}
     
     The summary should:
     1. Highlight the overall match rate.
     2. Identify the top risk areas based on the discrepancies.
     3. Provide a recommendation (Go/No-Go or Remediation needed).
     4. Use professional banking terminology.
   `;

   try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Unable to generate summary.";
  } catch (error) {
    return "Error generating summary.";
  }
}