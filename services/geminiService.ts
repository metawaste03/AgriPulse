import { AdviceMessage } from "../types";

const getLayerAIAdvice = (farmData: any): AdviceMessage[] => {
    const advice: AdviceMessage[] = [];

    // Critical Checks
    if (farmData.mortalityRate > 0.5) {
        advice.push({ type: 'critical', message: `Critical mortality rate of ${farmData.mortalityRate.toFixed(1)}% today. Investigate flock health immediately.` });
    }
    if (farmData.profit < -5000) {
        advice.push({ type: 'critical', message: `Significant financial loss of ₦${Math.abs(farmData.profit).toLocaleString()} today. Review costs and sales data.` });
    }

    // Warning Checks
    if (farmData.feedAlertType === 'percentage' && farmData.feedStockPercentage < farmData.feedAlertValue) {
        advice.push({ type: 'warning', message: `Feed stock is low at ${farmData.feedStockPercentage.toFixed(1)}%, below your ${farmData.feedAlertValue}% threshold. Plan to restock soon.` });
    } else if (farmData.feedAlertType === 'bags' && farmData.bagsInStock < farmData.feedAlertValue) {
        advice.push({ type: 'warning', message: `Feed stock is low at ${farmData.bagsInStock.toFixed(1)} bags, below your ${farmData.feedAlertValue} bag threshold. Plan to restock.` });
    }

    if (farmData.layingCapacity > 0 && farmData.avgLayingCapacity7d > 0 && farmData.layingCapacity < (farmData.avgLayingCapacity7d * 0.9)) {
        advice.push({ type: 'warning', message: `Today's laying capacity (${farmData.layingCapacity.toFixed(1)}%) is notably lower than the 7-day average (${farmData.avgLayingCapacity7d.toFixed(1)}%). Monitor for potential issues.` });
    }
    
    if (farmData.fcr > 3.0 && farmData.fcr !== Infinity) {
        advice.push({ type: 'warning', message: `Feed Conversion Ratio (${farmData.fcr.toFixed(2)}) is high. Ensure proper feeding and check for feed wastage.` });
    }

    // Positive Checks
    if (farmData.profit > 10000) {
        advice.push({ type: 'positive', message: `Excellent profit of ₦${farmData.profit.toLocaleString()} today! Your management is paying off.` });
    }
    if (farmData.layingCapacity > 85) {
        advice.push({ type: 'positive', message: `Laying capacity is strong at ${farmData.layingCapacity.toFixed(1)}%. Great job!` });
    }
    
    return advice;
};

const getBroilerAIAdvice = (farmData: any): AdviceMessage[] => {
    const advice: AdviceMessage[] = [];

    // Critical Checks
    if (farmData.mortalityRate > 0.5) {
        advice.push({ type: 'critical', message: `Critical mortality rate of ${farmData.mortalityRate.toFixed(1)}% today. Check for signs of disease or stress.` });
    }
    if (farmData.adg < 0) {
        advice.push({ type: 'critical', message: `Average Daily Gain is negative (${farmData.adg.toFixed(1)} g/day). This requires immediate attention to feed, water, and flock health.` });
    }

    // Warning Checks
    if (farmData.fcr > 2.5 && farmData.fcr !== Infinity) {
        advice.push({ type: 'warning', message: `FCR is very high at ${farmData.fcr.toFixed(2)}. Review your feeding program and check for wastage. Aim for below 1.8.` });
    } else if (farmData.fcr > 1.8 && farmData.fcr !== Infinity) {
        advice.push({ type: 'warning', message: `FCR is a bit high at ${farmData.fcr.toFixed(2)}. Aim for a value below 1.8 for better efficiency.` });
    }
    
    if (farmData.adg > 0 && farmData.adg < 30) {
        advice.push({ type: 'warning', message: `Average Daily Gain (${farmData.adg.toFixed(1)} g/day) seems low. Ensure constant access to high-quality feed and water.` });
    }

    // Positive Checks
    if (farmData.fcr < 1.6 && farmData.fcr > 0) {
        advice.push({ type: 'positive', message: `Excellent FCR of ${farmData.fcr.toFixed(2)}! Your feeding strategy is very efficient.` });
    }
    if (farmData.adg > 60) {
        advice.push({ type: 'positive', message: `Great average daily gain of ${farmData.adg.toFixed(1)} g/day! The flock is growing well.` });
    }

    return advice;
};

const getFishAIAdvice = (farmData: any): AdviceMessage[] => {
    const advice: AdviceMessage[] = [];
    const { todayLog } = farmData;

    // Critical Checks
    if (farmData.mortalityRate > 1) {
        advice.push({ type: 'critical', message: `Critical mortality rate of ${farmData.mortalityRate.toFixed(1)}% today. Check water quality and for signs of disease.` });
    }
    if (todayLog?.waterPH && (todayLog.waterPH < 6.0 || todayLog.waterPH > 9.0)) {
        advice.push({ type: 'critical', message: `Water pH is at a critical level (${todayLog.waterPH}). This can be toxic to fish. Take corrective action.` });
    }

    // Warning Checks
    if (farmData.fcr > 1.8 && farmData.fcr !== Infinity) {
        advice.push({ type: 'warning', message: `FCR is high at ${farmData.fcr.toFixed(2)}. Review feeding amounts and feed quality. Ideal FCR is below 1.5.` });
    }
    if (farmData.growthRate <= 0 && farmData.daysSinceStocking > 7) {
        advice.push({ type: 'warning', message: `Fish growth has stagnated. Check feeding rates, water quality, and stocking density.` });
    }
    if (todayLog?.waterPH && ((todayLog.waterPH < 6.5) || (todayLog.waterPH > 8.5))) {
        advice.push({ type: 'warning', message: `Water pH of ${todayLog.waterPH} is outside the ideal range of 6.5-8.5. Monitor closely.` });
    }
    if (todayLog?.waterTemp && (todayLog.waterTemp < 22 || todayLog.waterTemp > 32)) {
        advice.push({ type: 'warning', message: `Water temperature (${todayLog.waterTemp}°C) is outside the optimal range (24-30°C). This can stress the fish.` });
    }
    
    // Positive Checks
    if (farmData.fcr < 1.5 && farmData.fcr > 0) {
        advice.push({ type: 'positive', message: `Excellent FCR of ${farmData.fcr.toFixed(2)}. Your feeding management is effective.` });
    }
    if (farmData.growthRate > 3) {
         advice.push({ type: 'positive', message: `Good growth rate of ${farmData.growthRate.toFixed(1)} g/day.` });
    }

    return advice;
};

export { getLayerAIAdvice, getBroilerAIAdvice, getFishAIAdvice };