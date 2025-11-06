import { GoogleGenAI, Type } from "@google/genai";
import { AdviceMessage } from "../types";

const getLayerAIAdvice = async (farmData: any): Promise<AdviceMessage[]> => {
  if (!process.env.API_KEY) return [{ type: 'warning', message: 'Gemini API key not configured. Smart Advisor is offline.' }];
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `You are an expert poultry farm advisor for an app called 'AgriPulse'. Analyze the following LAYER farm data and provide a JSON array of advice objects. Each object must have 'type' ('critical', 'warning', or 'positive') and 'message' (a concise, helpful string for the farmer). Respond with only the JSON.

    Farm Data:
    - Initial Flock Size: ${farmData.initialBirds}; Current Flock Size: ${farmData.currentBirds}; Total Mortality: ${farmData.initialBirds - farmData.currentBirds}
    - Flock Age (days): ${farmData.flockAge}
    - Feed Alert Threshold: ${farmData.feedAlertValue} ${farmData.feedAlertType}
    - Feed in Stock: ${farmData.feedInStock.toFixed(1)} kg (${farmData.bagsInStock.toFixed(1)} bags)
    - Feed Stock Percentage: ${farmData.feedStockPercentage.toFixed(1)}%
    Today's Log (${farmData.todayLog?.date || 'No log for today'}):
    - Laying Capacity: ${farmData.layingCapacity.toFixed(1)}%
    - Mortality Today: ${farmData.todayLog?.mortality || 0} birds (${farmData.mortalityRate.toFixed(2)}% of flock)
    - Feed Consumed: ${farmData.todayLog?.feedUsed || 0} kg
    - Feed Conversion Ratio (kg feed/crate): ${farmData.fcr.toFixed(2)}
    - Total Income Today: ₦${farmData.incomeToday.toFixed(0)}
    - Profit/Loss Today: ₦${farmData.profit.toFixed(0)}
    - 7-day avg laying capacity: ${farmData.avgLayingCapacity7d.toFixed(1)}%
    - 7-day total mortality: ${farmData.totalMortality7d}

    Generate advisory messages. Prioritize critical issues like high mortality (>0.5% daily), low feed, major financial loss, or sudden drops in laying capacity.`;
  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, message: { type: Type.STRING } }, required: ["type", "message"] } } }
    });
    return JSON.parse(response.text.trim());
  } catch (error) { console.error("Error calling Gemini API:", error); return [{ type: 'critical', message: 'Could not connect to the AI Smart Advisor.' }]; }
};

const getBroilerAIAdvice = async (farmData: any): Promise<AdviceMessage[]> => {
    if (!process.env.API_KEY) return [{ type: 'warning', message: 'Gemini API key not configured. Smart Advisor is offline.' }];
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `You are an expert poultry farm advisor for an app called 'AgriPulse'. Analyze the following BROILER farm data and provide a JSON array of advice objects. Each object must have 'type' ('critical', 'warning', or 'positive') and 'message' (a concise, helpful string for the farmer). Respond with only the JSON.

    Farm Data:
    - Initial Flock Size: ${farmData.initialBirds}; Current Flock Size: ${farmData.currentBirds}; Total Mortality: ${farmData.initialBirds - farmData.currentBirds}
    - Flock Age (days): ${farmData.flockAge}
    - Feed Alert Threshold: ${farmData.feedAlertValue} ${farmData.feedAlertType}
    - Feed in Stock: ${farmData.feedInStock.toFixed(1)} kg (${farmData.bagsInStock.toFixed(1)} bags)
    Today's Log (${farmData.todayLog?.date || 'No log for today'}):
    - Average Weight: ${farmData.todayLog?.avgWeight || 0} g
    - Average Daily Gain (ADG): ${farmData.adg.toFixed(1)} g/day
    - Mortality Today: ${farmData.todayLog?.mortality || 0} birds (${farmData.mortalityRate.toFixed(2)}% of flock)
    - Feed Consumed: ${farmData.todayLog?.feedUsed || 0} kg
    - Feed Conversion Ratio (FCR): ${farmData.fcr.toFixed(2)}
    - 7-day total mortality: ${farmData.totalMortality7d}
    - Total Income Today: ₦${farmData.incomeToday.toFixed(0)}

    Generate advisory messages. Prioritize critical issues like high mortality (>0.5% daily), negative ADG, or very high FCR (>2.5). A good FCR is below 1.8.`;
    try {
      const response = await ai.models.generateContent({
          model: "gememini-2.5-flash", contents: prompt,
          config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, message: { type: Type.STRING } }, required: ["type", "message"] } } }
      });
      return JSON.parse(response.text.trim());
    } catch (error) { console.error("Error calling Broiler Gemini API:", error); return [{ type: 'critical', message: 'Could not connect to the AI Smart Advisor.' }]; }
};

const getFishAIAdvice = async (farmData: any): Promise<AdviceMessage[]> => {
    if (!process.env.API_KEY) return [{ type: 'warning', message: 'Gemini API key not configured. Smart Advisor is offline.' }];
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `You are an expert aquaculture advisor for an app called 'AgriPulse'. Analyze the following FISH farm data (likely for Catfish or Tilapia in Nigeria) and provide a JSON array of advice objects. Each object must have 'type' ('critical', 'warning', or 'positive') and 'message' (a concise, helpful string for the farmer). Respond with only the JSON.

    Farm Data:
    - Fish Type: ${farmData.fishType}
    - Initial Stock: ${farmData.initialQuantity} fish at ${farmData.initialAvgWeight}g each.
    - Current Stock: ${farmData.currentQuantity} fish.
    - Days Since Stocking: ${farmData.daysSinceStocking}
    - Total Biomass: ${farmData.totalBiomass.toFixed(2)} kg
    Today's Log (${farmData.todayLog?.date || 'No log for today'}):
    - Mortality Today: ${farmData.todayLog?.mortality || 0} fish (${farmData.mortalityRate.toFixed(2)}% of stock)
    - Feed Consumed: ${farmData.todayLog?.feedUsed || 0} kg
    - Feed Conversion Ratio (FCR): ${farmData.fcr.toFixed(2)}
    - Avg Weight Sample: ${farmData.latestAvgWeight} g
    - Growth Rate: ${farmData.growthRate.toFixed(1)} g/day
    - Water pH: ${farmData.todayLog?.waterPH || 'N/A'}
    - Water Temperature: ${farmData.todayLog?.waterTemp || 'N/A'} °C

    Generate advisory messages. Ideal pH is 6.5-8.5. Ideal temp is 24-30°C. FCR should be low (ideally < 1.5). Prioritize critical issues like high mortality (>1% daily), poor water quality, high FCR, or stagnant growth.`;
    try {
      const response = await ai.models.generateContent({
          model: "gemini-2.5-flash", contents: prompt,
          config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, message: { type: Type.STRING } }, required: ["type", "message"] } } }
      });
      return JSON.parse(response.text.trim());
    } catch (error) { console.error("Error calling Fish Gemini API:", error); return [{ type: 'critical', message: 'Could not connect to the AI Smart Advisor.' }]; }
};

export { getLayerAIAdvice, getBroilerAIAdvice, getFishAIAdvice };
