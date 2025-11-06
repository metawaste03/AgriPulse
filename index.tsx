import { GoogleGenAI, Type } from "@google/genai";

// --- Gemini AI Service ---
const getLayerAIAdvice = async (farmData: any): Promise<any[]> => {
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

const getBroilerAIAdvice = async (farmData: any): Promise<any[]> => {
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
          model: "gemini-2.5-flash", contents: prompt,
          config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, message: { type: Type.STRING } }, required: ["type", "message"] } } }
      });
      return JSON.parse(response.text.trim());
    } catch (error) { console.error("Error calling Broiler Gemini API:", error); return [{ type: 'critical', message: 'Could not connect to the AI Smart Advisor.' }]; }
};

const getFishAIAdvice = async (farmData: any): Promise<any[]> => {
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


// --- Main Application Logic ---
document.addEventListener('DOMContentLoaded', () => {
    let currentFarmType: 'layers' | 'broilers' | 'fish' = 'layers';
    let currentEditLogId: number | null = null;
    let currentEditIncomeId: number | null = null;
    
    // --- Helper Functions ---
    const getTodayDate = () => new Date().toISOString().split('T')[0];

    const parseDateString = (dateString: string): Date | null => {
        if (!dateString || typeof dateString !== 'string') return null;
        const parts = dateString.split('-');
        if (parts.length !== 3) return null;
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // month is 0-indexed
        const day = parseInt(parts[2], 10);
        if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
        const date = new Date(year, month, day);
        // Final check to catch invalid dates like '2023-02-30'
        if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
            return null;
        }
        return date;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = parseDateString(dateString);
        if (!date) return dateString;
        return date.toLocaleDateString('en-GB'); // Use locale for DD/MM/YYYY
    };

    const getStorageKey = (key: string) => `${currentFarmType}_${key}`;
    const getData = (key: string) => JSON.parse(localStorage.getItem(getStorageKey(key)) || '[]');
    const setData = (key: string, data: any) => localStorage.setItem(getStorageKey(key), JSON.stringify(data));

    // --- Page & Element Getters ---
    const pages = document.querySelectorAll('.page');
    const signinBtn = document.getElementById('signin-btn');
    const navToSettingsFromDash = document.getElementById('nav-to-settings-from-dash');
    const farmTypeLayersBtn = document.getElementById('farm-type-layers');
    const farmTypeBroilersBtn = document.getElementById('farm-type-broilers');
    const farmTypeFishBtn = document.getElementById('farm-type-fish');
    // ... other elements
    const kpiGridLayers = document.getElementById('kpi-grid-layers');
    const kpiGridBroilers = document.getElementById('kpi-grid-broilers');
    const kpiGridFish = document.getElementById('kpi-grid-fish');
    
    const settingsForLayers = document.getElementById('settings-for-layers');
    const settingsForBroilers = document.getElementById('settings-for-broilers');
    const settingsForFish = document.getElementById('settings-for-fish');
    
    const modalBodyLayers = document.getElementById('modal-body-layers');
    const modalBodyBroilers = document.getElementById('modal-body-broilers');
    const modalBodyFish = document.getElementById('modal-body-fish');
    
    const modalOverlay = document.getElementById('modal-overlay');
    const dailyLogModal = document.getElementById('daily-log-modal');
    const incomeLogModal = document.getElementById('income-log-modal');
    const modalSaveBtn = document.getElementById('modal-save-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const incomeModalSaveBtn = document.getElementById('income-modal-save-btn');
    const advisorMessagesContainer = document.getElementById('ai-advisor-messages');


    function switchFarmTypeUI() {
        const isLayers = currentFarmType === 'layers';
        const isBroilers = currentFarmType === 'broilers';
        const isFish = currentFarmType === 'fish';

        farmTypeLayersBtn.classList.toggle('active', isLayers);
        farmTypeBroilersBtn.classList.toggle('active', isBroilers);
        farmTypeFishBtn.classList.toggle('active', isFish);

        kpiGridLayers.style.display = isLayers ? 'grid' : 'none';
        kpiGridBroilers.style.display = isBroilers ? 'grid' : 'none';
        kpiGridFish.style.display = isFish ? 'grid' : 'none';

        settingsForLayers.style.display = isLayers ? 'block' : 'none';
        settingsForBroilers.style.display = isBroilers ? 'block' : 'none';
        settingsForFish.style.display = isFish ? 'block' : 'none';

        modalBodyLayers.style.display = isLayers ? 'block' : 'none';
        modalBodyBroilers.style.display = isBroilers ? 'block' : 'none';
        modalBodyFish.style.display = isFish ? 'block' : 'none';
    }

    function switchFarmType(newType: 'layers' | 'broilers' | 'fish') {
        currentFarmType = newType;
        localStorage.setItem('currentFarmType', newType);
        switchFarmTypeUI();
        updateDashboard();
        if (document.getElementById('page-settings').classList.contains('active')) {
            loadSettings();
        }
    }

    farmTypeLayersBtn.addEventListener('click', () => switchFarmType('layers'));
    farmTypeBroilersBtn.addEventListener('click', () => switchFarmType('broilers'));
    farmTypeFishBtn.addEventListener('click', () => switchFarmType('fish'));

    function showPage(pageId: string) {
        pages.forEach(page => page.classList.remove('active'));
        const pageElement = document.getElementById(pageId);
        if (pageElement) {
            if (pageId === 'page-settings') loadSettings();
            else if (pageId === 'page-dashboard') updateDashboard();
            else if (pageId === 'page-feed') (document.getElementById('feed-date') as HTMLInputElement).value = getTodayDate();
            else if (pageId === 'page-history') loadLogHistory();
            else if (pageId === 'page-income') loadIncomeLedger();
            pageElement.classList.add('active');
        }
    }

    function getSettings() {
        // Shared settings are stored without prefix for simplicity
        const sharedSettings = JSON.parse(localStorage.getItem('shared_settings') || '{}');
        const farmSettings = JSON.parse(localStorage.getItem(getStorageKey('settings')) || '{}');
        const dailyLogs = getData('dailyLogs');
        let initialStock = 0;
        if(currentFarmType === 'fish'){
            initialStock = parseFloat(farmSettings.initialQuantity || '0');
        } else {
            initialStock = parseFloat(farmSettings.initialBirds || '0');
        }
        
        const totalMortality = dailyLogs.reduce((sum: number, log: any) => sum + Number(log.mortality || 0), 0);
        
        return {
            ...sharedSettings,
            ...farmSettings,
            initialStock,
            currentStock: initialStock - totalMortality,
            dailyFixedCost: (parseFloat(sharedSettings.laborCost || 0) + parseFloat(sharedSettings.rentCost || 0) + parseFloat(sharedSettings.powerCost || 0) + parseFloat(sharedSettings.waterCost || 0) + parseFloat(sharedSettings.miscCost || 0)) / 30,
            feedAlertType: sharedSettings.feedAlertType || 'percentage',
            feedAlertValue: parseFloat(sharedSettings.feedAlertValue || (sharedSettings.feedAlertType === 'bags' ? '10' : '25')),
        };
    }

    function saveSettings() {
        const sharedSettings = {
            laborCost: (document.getElementById('labor-cost') as HTMLInputElement).value,
            rentCost: (document.getElementById('toggle-rent-cost') as HTMLInputElement).checked ? (document.getElementById('rent-cost') as HTMLInputElement).value : '0',
            powerCost: (document.getElementById('toggle-power-cost') as HTMLInputElement).checked ? (document.getElementById('power-cost') as HTMLInputElement).value : '0',
            waterCost: (document.getElementById('toggle-water-cost') as HTMLInputElement).checked ? (document.getElementById('water-cost') as HTMLInputElement).value : '0',
            miscCost: (document.getElementById('toggle-misc-cost') as HTMLInputElement).checked ? (document.getElementById('misc-cost') as HTMLInputElement).value : '0',
            feedAlertType: (document.getElementById('alert-type-percent') as HTMLElement).classList.contains('active') ? 'percentage' : 'bags',
            feedAlertValue: (document.getElementById('alert-type-percent') as HTMLElement).classList.contains('active')
                ? (document.getElementById('feed-alert-value-percent') as HTMLInputElement).value
                : (document.getElementById('feed-alert-value-bags') as HTMLInputElement).value,
        };
        localStorage.setItem('shared_settings', JSON.stringify(sharedSettings));

        let farmSettings = {};
        if (currentFarmType === 'layers') {
            farmSettings = {
                initialBirds: (document.getElementById('initial-birds-layers') as HTMLInputElement).value,
                flockStartDate: (document.getElementById('flock-start-date-layers') as HTMLInputElement).value,
                showFlockAge: (document.getElementById('toggle-show-flock-age-layers') as HTMLInputElement).checked,
            };
            let eggPrices: {name: string, price: number}[] = [];
            document.querySelectorAll('#egg-prices-list input[type="number"]').forEach(input => {
                const inp = input as HTMLInputElement;
                eggPrices.push({ name: inp.dataset.name, price: parseFloat(inp.value || '0') });
            });
            setData('eggPrices', eggPrices);
        } else if (currentFarmType === 'broilers') {
            farmSettings = {
                initialBirds: (document.getElementById('initial-birds-broilers') as HTMLInputElement).value,
                flockStartDate: (document.getElementById('flock-start-date-broilers') as HTMLInputElement).value,
                showFlockAge: (document.getElementById('toggle-show-flock-age-broilers') as HTMLInputElement).checked,
                targetWeight: (document.getElementById('target-weight') as HTMLInputElement).value,
            };
        } else { // Fish
            farmSettings = {
                fishType: (document.getElementById('fish-type') as HTMLInputElement).value,
                stockingDate: (document.getElementById('stocking-date') as HTMLInputElement).value,
                initialQuantity: (document.getElementById('initial-fish-quantity') as HTMLInputElement).value,
                initialAvgWeight: (document.getElementById('initial-fish-avg-weight') as HTMLInputElement).value,
            };
        }
        localStorage.setItem(getStorageKey('settings'), JSON.stringify(farmSettings));
        
        localStorage.setItem('settingsSaved', 'true'); // Global flag
        alert('Settings Saved!');
        showPage('page-dashboard');
    }

    function loadCostToggle(checkboxId: string, inputId: string, value: string) {
        const checkbox = document.getElementById(checkboxId) as HTMLInputElement;
        const input = document.getElementById(inputId) as HTMLInputElement;
        const container = input.closest('.cost-input-container') as HTMLElement;
        const numValue = parseFloat(value || '0');

        if (numValue > 0 || (value && value !== '0')) {
            checkbox.checked = true;
            input.value = value;
            container.style.display = 'block';
        } else {
            checkbox.checked = false;
            input.value = '';
            container.style.display = 'none';
        }
    }

    function loadSettings() {
        const sharedSettings = JSON.parse(localStorage.getItem('shared_settings') || '{}');
        const farmSettings = JSON.parse(localStorage.getItem(getStorageKey('settings')) || '{}');

        // Load shared settings
        (document.getElementById('labor-cost') as HTMLInputElement).value = sharedSettings.laborCost || '';
        loadCostToggle('toggle-rent-cost', 'rent-cost', sharedSettings.rentCost);
        loadCostToggle('toggle-power-cost', 'power-cost', sharedSettings.powerCost);
        loadCostToggle('toggle-water-cost', 'water-cost', sharedSettings.waterCost);
        loadCostToggle('toggle-misc-cost', 'misc-cost', sharedSettings.miscCost);
        
        const feedAlertType = sharedSettings.feedAlertType || 'percentage';
        document.getElementById('alert-type-percent').classList.toggle('active', feedAlertType === 'percentage');
        document.getElementById('alert-type-bags').classList.toggle('active', feedAlertType === 'bags');
        document.getElementById('alert-input-percent').style.display = feedAlertType === 'percentage' ? 'block' : 'none';
        document.getElementById('alert-input-bags').style.display = feedAlertType === 'bags' ? 'block' : 'none';
        (document.getElementById('feed-alert-value-percent') as HTMLInputElement).value = sharedSettings.feedAlertValue || '25';
        (document.getElementById('feed-alert-value-bags') as HTMLInputElement).value = sharedSettings.feedAlertValue || '10';

        // Load farm-specific settings
        if (currentFarmType === 'layers') {
            (document.getElementById('initial-birds-layers') as HTMLInputElement).value = farmSettings.initialBirds || '';
            (document.getElementById('flock-start-date-layers') as HTMLInputElement).value = farmSettings.flockStartDate || '';
            (document.getElementById('toggle-show-flock-age-layers') as HTMLInputElement).checked = !!farmSettings.showFlockAge;
            const eggPrices = getData('eggPrices');
            const eggPricesList = document.getElementById('egg-prices-list');
            eggPricesList.innerHTML = '';
            if (eggPrices.length === 0) { ['Jumbo', 'Large', 'Pullet'].forEach((name:string) => addEggPriceRow(name, 0)); }
            else { eggPrices.forEach((egg: any) => addEggPriceRow(egg.name, egg.price)); }
        } else if (currentFarmType === 'broilers') {
            (document.getElementById('initial-birds-broilers') as HTMLInputElement).value = farmSettings.initialBirds || '';
            (document.getElementById('flock-start-date-broilers') as HTMLInputElement).value = farmSettings.flockStartDate || '';
            (document.getElementById('toggle-show-flock-age-broilers') as HTMLInputElement).checked = !!farmSettings.showFlockAge;
            (document.getElementById('target-weight') as HTMLInputElement).value = farmSettings.targetWeight || '';
        } else { // Fish
            (document.getElementById('fish-type') as HTMLInputElement).value = farmSettings.fishType || '';
            (document.getElementById('stocking-date') as HTMLInputElement).value = farmSettings.stockingDate || '';
            (document.getElementById('initial-fish-quantity') as HTMLInputElement).value = farmSettings.initialQuantity || '';
            (document.getElementById('initial-fish-avg-weight') as HTMLInputElement).value = farmSettings.initialAvgWeight || '';
        }
    }
    
    function addEggPriceRow(name: string, price: number) {
        const eggPricesList = document.getElementById('egg-prices-list');
        const row = document.createElement('div');
        row.className = 'dynamic-price-row';
        row.innerHTML = `<label>${name}</label><input type="number" value="${price || ''}" placeholder="0" data-name="${name}">`;
        eggPricesList.appendChild(row);
    }

    function openModal() {
        currentEditLogId = null;
        (document.getElementById('modal-title') as HTMLElement).textContent = "Add Daily Log";
        const { currentStock } = getSettings();
        document.querySelectorAll('.mortality-start-total').forEach(el => el.textContent = currentStock.toLocaleString());
        document.querySelectorAll('.log-mortality').forEach(el => (el as HTMLInputElement).value = '');
        document.querySelectorAll('.mortality-new-total').forEach(el => el.textContent = currentStock.toLocaleString());
        
        if (currentFarmType === 'layers') {
            (document.getElementById('log-date-layers') as HTMLInputElement).value = getTodayDate();
            const eggPrices = getData('eggPrices');
            const modalEggInputs = document.getElementById('modal-egg-inputs');
            modalEggInputs.innerHTML = '';
            eggPrices.forEach((egg: any) => {
                modalEggInputs.innerHTML += `<div class="egg-input-group"><label>${egg.name}</label><div class="egg-input-row"><div><label>Crates</label><input type="number" id="log-eggs-crates-${egg.name}" data-name="${egg.name}" placeholder="0"></div><div><label>Eggs</label><input type="number" id="log-eggs-loose-${egg.name}" data-name="${egg.name}" placeholder="0"></div></div></div>`;
            });
        } else if (currentFarmType === 'broilers') {
            (document.getElementById('log-date-broilers') as HTMLInputElement).value = getTodayDate();
        } else { // Fish
            (document.getElementById('log-date-fish') as HTMLInputElement).value = getTodayDate();
        }

        modalOverlay.classList.add('active');
        dailyLogModal.classList.add('active');
    }

    function saveDailyLog() {
        let logEntry: any = { id: currentEditLogId || Date.now() };
        
        if(currentFarmType === 'layers') {
            let eggsData: { [key: string]: number } = {};
            getData('eggPrices').forEach((egg: any) => {
                const crates = parseFloat((document.getElementById(`log-eggs-crates-${egg.name}`) as HTMLInputElement).value || '0');
                const loose = parseFloat((document.getElementById(`log-eggs-loose-${egg.name}`) as HTMLInputElement).value || '0');
                eggsData[egg.name] = crates + (loose / 30);
            });
            logEntry = { ...logEntry, date: (document.getElementById('log-date-layers') as HTMLInputElement).value, mortality: parseFloat((modalBodyLayers.querySelector('.log-mortality') as HTMLInputElement).value || '0'), eggs: eggsData, feedUsed: parseFloat((document.getElementById('log-feed-layers') as HTMLInputElement).value || '0'), miscCost: parseFloat((document.getElementById('log-misc-cost-layers') as HTMLInputElement).value || '0'), };
        } else if (currentFarmType === 'broilers') {
            logEntry = { ...logEntry, date: (document.getElementById('log-date-broilers') as HTMLInputElement).value, mortality: parseFloat((modalBodyBroilers.querySelector('.log-mortality') as HTMLInputElement).value || '0'), avgWeight: parseFloat((document.getElementById('log-avg-weight') as HTMLInputElement).value || '0'), feedType: (document.getElementById('log-feed-type') as HTMLInputElement).value, feedUsed: parseFloat((document.getElementById('log-feed-broilers') as HTMLInputElement).value || '0'), miscCost: parseFloat((document.getElementById('log-misc-cost-broilers') as HTMLInputElement).value || '0'), };
        } else { // Fish
            logEntry = { ...logEntry, date: (document.getElementById('log-date-fish') as HTMLInputElement).value, mortality: parseFloat((modalBodyFish.querySelector('.log-mortality') as HTMLInputElement).value || '0'), avgWeight: parseFloat((document.getElementById('log-avg-weight-fish') as HTMLInputElement).value || '0'), feedUsed: parseFloat((document.getElementById('log-feed-fish') as HTMLInputElement).value || '0'), waterPH: parseFloat((document.getElementById('log-water-ph') as HTMLInputElement).value || '0'), waterTemp: parseFloat((document.getElementById('log-water-temp') as HTMLInputElement).value || '0'), miscCost: parseFloat((document.getElementById('log-misc-cost-fish') as HTMLInputElement).value || '0'), };
        }
        
        let dailyLogs = getData('dailyLogs');
        if (currentEditLogId) {
            const index = dailyLogs.findIndex((log: any) => log.id == currentEditLogId);
            if (index > -1) dailyLogs[index] = logEntry;
        } else {
            dailyLogs.push(logEntry);
        }
        dailyLogs.sort((a: any, b: any) => (parseDateString(a.date)?.getTime() || 0) - (parseDateString(b.date)?.getTime() || 0));
        setData('dailyLogs', dailyLogs);

        modalOverlay.classList.remove('active');
        dailyLogModal.classList.remove('active');
        updateDashboard();
    }
    
    function openIncomeModal() {
        currentEditIncomeId = null;
        (document.getElementById('income-modal-title') as HTMLElement).textContent = "Add Income Entry";
        (document.getElementById('income-date') as HTMLInputElement).value = getTodayDate();
        (document.getElementById('income-quantity') as HTMLInputElement).value = '';
        (document.getElementById('income-weight') as HTMLInputElement).value = '';
        (document.getElementById('income-amount') as HTMLInputElement).value = '';
        (document.getElementById('income-notes') as HTMLTextAreaElement).value = '';
        
        (document.getElementById('income-category-layers') as HTMLElement).style.display = currentFarmType === 'layers' ? 'block' : 'none';
        (document.getElementById('income-category-broilers') as HTMLElement).style.display = currentFarmType === 'broilers' ? 'block' : 'none';
        (document.getElementById('income-category-fish') as HTMLElement).style.display = currentFarmType === 'fish' ? 'block' : 'none';
        updateIncomeQuantityLabel();

        modalOverlay.classList.add('active');
        incomeLogModal.classList.add('active');
    }

    function saveIncomeEntry() {
        let category: string;
        if(currentFarmType === 'layers') category = (document.getElementById('income-category-layers') as HTMLSelectElement).value;
        else if (currentFarmType === 'broilers') category = (document.getElementById('income-category-broilers') as HTMLSelectElement).value;
        else category = (document.getElementById('income-category-fish') as HTMLSelectElement).value;

        const incomeEntry = { id: currentEditIncomeId || Date.now(), date: (document.getElementById('income-date') as HTMLInputElement).value, category, quantity: parseFloat((document.getElementById('income-quantity') as HTMLInputElement).value || '0'), weight: parseFloat((document.getElementById('income-weight') as HTMLInputElement).value || '0'), amount: parseFloat((document.getElementById('income-amount') as HTMLInputElement).value || '0'), notes: (document.getElementById('income-notes') as HTMLTextAreaElement).value, };

        let incomeEntries = getData('incomeEntries');
        if (currentEditIncomeId) {
            const index = incomeEntries.findIndex((entry: any) => entry.id == currentEditIncomeId);
            if(index > -1) incomeEntries[index] = incomeEntry;
        } else {
            incomeEntries.push(incomeEntry);
        }
        setData('incomeEntries', incomeEntries);
        
        modalOverlay.classList.remove('active');
        incomeLogModal.classList.remove('active');
        loadIncomeLedger();
    }
    
    function updateIncomeQuantityLabel() {
        let category: string;
        if(currentFarmType === 'layers') category = (document.getElementById('income-category-layers') as HTMLSelectElement).value;
        else if (currentFarmType === 'broilers') category = (document.getElementById('income-category-broilers') as HTMLSelectElement).value;
        else category = (document.getElementById('income-category-fish') as HTMLSelectElement).value;
        
        const quantityLabel = document.getElementById('income-quantity-label') as HTMLLabelElement;
        const weightContainer = document.getElementById('income-weight-container') as HTMLElement;
        
        let labelText = 'Quantity';
        weightContainer.style.display = 'none';

        if(category.includes('Birds') || category.includes('Fish')) {
            labelText = 'Number of Items';
            weightContainer.style.display = 'block';
        } else if (category.includes('Egg')) {
            labelText = 'Quantity (Crates)';
        } else if (category.includes('Manure')) {
            labelText = 'Quantity (Bags)';
        }
        quantityLabel.textContent = labelText;
    }

    function loadIncomeLedger(filter: 'today' | 'week' | 'month' | 'all' = 'today') {
        const incomeEntries = getData('incomeEntries');
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
        const filteredEntries = incomeEntries.filter((entry: any) => {
            const entryDate = parseDateString(entry.date);
            if (!entryDate) return false;
            if (filter === 'today') return entryDate.getTime() === today.getTime();
            if (filter === 'week') return entryDate >= weekStart;
            if (filter === 'month') return entryDate >= monthStart;
            return true;
        });
    
        const totalRevenue = filteredEntries.reduce((sum: number, entry: any) => sum + Number(entry.amount || 0), 0);
        (document.getElementById('income-summary-revenue') as HTMLElement).textContent = `₦${totalRevenue.toLocaleString()}`;
        (document.getElementById('income-summary-count') as HTMLElement).textContent = filteredEntries.length.toLocaleString();
        
        const historyList = document.getElementById('income-history-list');
        historyList.innerHTML = filteredEntries.length === 0 ? '<p>No income entries for this period.</p>' : '';
    
        filteredEntries.slice().reverse().forEach((entry: any) => {
            historyList.innerHTML += `<li class="log-card"><div class="log-card-header"><h3>${formatDate(entry.date)} - ${entry.category}</h3><span style="font-size: 1.5rem; color: var(--brand-positive); font-weight: bold;">+₦${Number(entry.amount || 0).toLocaleString()}</span></div><div class="log-card-body"><p>Quantity: <span>${Number(entry.quantity || 0).toLocaleString()}</span></p>${entry.weight > 0 ? `<p>Weight: <span>${Number(entry.weight).toLocaleString()} kg</span></p>` : ''}</div>${entry.notes ? `<p style="margin-top: 1rem; font-style: italic;">Note: ${entry.notes}</p>` : ''}</li>`;
        });
        
        document.querySelectorAll('#page-income .filter-toggle button').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`income-filter-${filter}`).classList.add('active');
    }

    function updateFlockAgeKPI(settings: any): number {
        const flockAgeCard = document.getElementById(`kpi-card-flock-age-${currentFarmType}`);
        const flockAgeValue = document.getElementById(`kpi-flock-age-${currentFarmType}`);
        let flockAge = 0;
    
        if (flockAgeCard && flockAgeValue && settings.showFlockAge && settings.flockStartDate) {
            const startDate = parseDateString(settings.flockStartDate);
            const today = new Date();
            if (startDate) {
                flockAge = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                flockAgeValue.textContent = `${flockAge.toLocaleString()} days`;
                flockAgeCard.style.display = 'block';
            }
        } else if (flockAgeCard) {
            flockAgeCard.style.display = 'none';
        }
        return flockAge;
    }
    
    async function updateDashboard() {
        advisorMessagesContainer.innerHTML = '<p>Loading AI advice...</p>';
        if (currentFarmType === 'layers') await updateLayersDashboard();
        else if (currentFarmType === 'broilers') await updateBroilersDashboard();
        else await updateFishDashboard();
    }

    async function updateLayersDashboard() {
        const settings = getSettings();
        const flockAge = updateFlockAgeKPI(settings);
        const eggPrices = getData('eggPrices');
        const dailyLogs = getData('dailyLogs');
        const feedPurchases = JSON.parse(localStorage.getItem('shared_feedPurchases') || '[]');
        const incomeEntries = getData('incomeEntries');
        const todayLog = dailyLogs.find((log: any) => log.date === getTodayDate()) || {};

        const totalFeedBought = feedPurchases.reduce((sum: number, item: any) => sum + Number(item.weight || 0), 0);
        const totalFeedUsed = dailyLogs.reduce((sum: number, item: any) => sum + Number(item.feedUsed || 0), 0);
        const feedInStock = totalFeedBought - totalFeedUsed;
        const avgFeedCostPerKg = totalFeedBought > 0 ? feedPurchases.reduce((s:number, i:any) => s + Number(i.cost||0), 0) / totalFeedBought : 0;
        
        let eggSaleRevenue = 0;
        if (todayLog.eggs) {
            eggPrices.forEach((egg: { name: string, price: number}) => {
                eggSaleRevenue += (todayLog.eggs[egg.name] || 0) * egg.price;
            });
        }
        const incomeToday = incomeEntries.filter((i: any) => i.date === getTodayDate()).reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);
        
        const totalCost = settings.dailyFixedCost + ((todayLog.feedUsed || 0) * avgFeedCostPerKg) + (todayLog.miscCost || 0);
        const profit = (eggSaleRevenue + incomeToday) - totalCost;
        
        const totalCratesToday: number = todayLog.eggs ? Object.values(todayLog.eggs).reduce<number>((a, b) => a + Number(b || 0), 0) : 0;
        const layingCapacity = settings.currentStock > 0 ? (totalCratesToday * 30 / settings.currentStock) * 100 : 0;
        const fcr = totalCratesToday > 0 ? (todayLog.feedUsed || 0) / totalCratesToday : 0;
        
        (document.getElementById('kpi-laying-capacity') as HTMLElement).textContent = `${layingCapacity.toFixed(1)}%`;
        const profitEl = document.getElementById('kpi-profit') as HTMLElement;
        profitEl.textContent = `₦${Math.round(profit).toLocaleString()}`;
        profitEl.classList.toggle('negative', profit < 0);
        (document.getElementById('kpi-fcr') as HTMLElement).textContent = fcr.toFixed(2);
        (document.getElementById('kpi-feed-stock') as HTMLElement).textContent = `${feedInStock.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} kg`;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const last7DaysLogs = dailyLogs.filter((log: any) => {
            const logDate = parseDateString(log.date);
            return logDate && logDate >= sevenDaysAgo;
        });
        const totalMortality7d = last7DaysLogs.reduce((sum: number, log: any) => sum + Number(log.mortality || 0), 0);
        const totalLayingCapacitySum = last7DaysLogs.reduce((sum: number, log: any) => {
            const totalCrates: number = log.eggs ? Object.values(log.eggs).reduce<number>((a, b) => a + Number(b || 0), 0) : 0;
            const dayCapacity = settings.currentStock > 0 ? (totalCrates * 30 / settings.currentStock) * 100 : 0;
            return sum + dayCapacity;
        }, 0);
        const avgLayingCapacity7d = last7DaysLogs.length > 0 ? totalLayingCapacitySum / last7DaysLogs.length : layingCapacity;
        
        const farmData = { initialBirds: settings.initialStock, currentBirds: settings.currentStock, flockAge, ...settings, feedInStock, bagsInStock: feedInStock / 25, feedStockPercentage: totalFeedBought > 0 ? (feedInStock / totalFeedBought) * 100 : 0, todayLog, layingCapacity, mortalityRate: settings.currentStock > 0 && todayLog.mortality ? (todayLog.mortality / settings.currentStock) * 100 : 0, fcr, incomeToday, profit, avgLayingCapacity7d, totalMortality7d, };
        const adviceMessages = await getLayerAIAdvice(farmData);
        displayAdvice(adviceMessages);
    }
    
    async function updateBroilersDashboard() {
        const settings = getSettings();
        const flockAge = updateFlockAgeKPI(settings);
        const dailyLogs = getData('dailyLogs');
        const feedPurchases = JSON.parse(localStorage.getItem('shared_feedPurchases') || '[]');
        const incomeEntries = getData('incomeEntries');
        const todayLog = dailyLogs.find((log: any) => log.date === getTodayDate()) || {};
        const yesterdayLog = dailyLogs.find((log: any) => log.date === new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0]) || {};

        const totalFeedBought = feedPurchases.reduce((sum: number, item: any) => sum + Number(item.weight || 0), 0);
        const totalFeedUsed = dailyLogs.reduce((sum: number, item: any) => sum + Number(item.feedUsed || 0), 0);
        const feedInStock = totalFeedBought - totalFeedUsed;
        
        const todayWeight = Number(todayLog.avgWeight || 0);
        const yesterdayWeight = Number(yesterdayLog.avgWeight || 0);
        const adg = todayWeight > 0 && yesterdayWeight > 0 ? todayWeight - yesterdayWeight : 0;
        const weightGainKg = adg > 0 ? (adg * settings.currentStock) / 1000 : 0;
        const fcr = weightGainKg > 0 ? (todayLog.feedUsed || 0) / weightGainKg : 0;
        const mortalityRate = settings.currentStock > 0 && todayLog.mortality ? (todayLog.mortality / settings.currentStock) * 100 : 0;
        
        (document.getElementById('kpi-avg-weight') as HTMLElement).textContent = `${Math.round(todayWeight).toLocaleString()} g`;
        (document.getElementById('kpi-fcr-broiler') as HTMLElement).textContent = fcr.toFixed(2);
        const mortalityEl = document.getElementById('kpi-mortality-rate') as HTMLElement;
        mortalityEl.textContent = `${mortalityRate.toFixed(1)}%`;
        mortalityEl.classList.toggle('negative', mortalityRate > 0.5);
        (document.getElementById('kpi-feed-stock-broiler') as HTMLElement).textContent = `${feedInStock.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} kg`;
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const last7DaysLogs = dailyLogs.filter((log: any) => {
             const logDate = parseDateString(log.date);
             return logDate && logDate >= sevenDaysAgo;
        });
        const totalMortality7d = last7DaysLogs.reduce((sum: number, log: any) => sum + Number(log.mortality || 0), 0);
        const incomeToday = incomeEntries.filter((i: any) => i.date === getTodayDate()).reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);

        const farmData = { initialBirds: settings.initialStock, currentBirds: settings.currentStock, flockAge, ...settings, feedInStock, bagsInStock: feedInStock / 25, todayLog, adg, mortalityRate, fcr, totalMortality7d, incomeToday, };
        const adviceMessages = await getBroilerAIAdvice(farmData);
        displayAdvice(adviceMessages);
    }

    async function updateFishDashboard() {
        const settings = getSettings();
        const dailyLogs = getData('dailyLogs');
        const todayLog = dailyLogs.find((log: any) => log.date === getTodayDate()) || {};
        
        const weightLogs = dailyLogs.filter((log: any) => log.avgWeight > 0).sort((a: any, b: any) => (parseDateString(a.date)?.getTime() || 0) - (parseDateString(b.date)?.getTime() || 0));
        const latestWeightLog = weightLogs[weightLogs.length - 1] || {};
        const previousWeightLog = weightLogs[weightLogs.length - 2] || {};
        
        let daysSinceStocking = 0;
        if(settings.stockingDate){
            const stockingDate = parseDateString(settings.stockingDate);
            if (stockingDate) {
                const diff = new Date().getTime() - stockingDate.getTime();
                daysSinceStocking = Math.floor(diff / (1000 * 60 * 60 * 24));
            }
        }

        const latestAvgWeight = parseFloat(latestWeightLog.avgWeight || settings.initialAvgWeight || '0');
        const totalBiomass = (settings.currentStock * latestAvgWeight) / 1000; // in kg
        
        const weightGain = latestAvgWeight - parseFloat(previousWeightLog.avgWeight || settings.initialAvgWeight || '0');
        
        const latestDate = parseDateString(latestWeightLog.date);
        const previousDate = parseDateString(previousWeightLog.date);
        const daysBetweenSamples = latestDate && previousDate ? (latestDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24) : (daysSinceStocking || 1);
        
        const growthRate = weightGain / (daysBetweenSamples || 1);
        
        const totalFeedUsed = dailyLogs.reduce((sum: number, log: any) => sum + Number(log.feedUsed || 0), 0);
        const totalWeightGainKg = (settings.currentStock * latestAvgWeight / 1000) - (settings.initialStock * parseFloat(settings.initialAvgWeight || 0) / 1000);
        const fcr = totalWeightGainKg > 0 ? totalFeedUsed / totalWeightGainKg : 0;
        const mortalityRate = settings.currentStock > 0 && todayLog.mortality ? (todayLog.mortality / settings.currentStock) * 100 : 0;

        (document.getElementById('kpi-avg-weight-fish') as HTMLElement).textContent = `${Math.round(latestAvgWeight).toLocaleString()} g`;
        (document.getElementById('kpi-biomass-fish') as HTMLElement).textContent = `${totalBiomass.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} kg`;
        (document.getElementById('kpi-fcr-fish') as HTMLElement).textContent = fcr.toFixed(2);
        (document.getElementById('kpi-mortality-rate-fish') as HTMLElement).textContent = `${mortalityRate.toFixed(1)}%`;
        (document.getElementById('kpi-age-fish') as HTMLElement).textContent = `${daysSinceStocking.toLocaleString()} days`;

        const farmData = { ...settings, initialQuantity: settings.initialStock, currentQuantity: settings.currentStock, daysSinceStocking, totalBiomass, todayLog, mortalityRate, fcr, latestAvgWeight, growthRate };
        const adviceMessages = await getFishAIAdvice(farmData);
        displayAdvice(adviceMessages);
    }

    function displayAdvice(adviceMessages: any[]) {
        advisorMessagesContainer.innerHTML = '';
        if (adviceMessages && adviceMessages.length > 0) {
            adviceMessages.forEach(msg => {
                const card = document.createElement('div');
                card.className = `advisor-card ${msg.type}`;
                card.textContent = msg.message;
                card.style.display = 'block';
                advisorMessagesContainer.appendChild(card);
            });
        } else {
            advisorMessagesContainer.innerHTML = '<div class="advisor-card positive" style="display:block;">All metrics look good! Keep up the great work.</div>';
        }
    }
    
    function loadLogHistory() {
        const logHistoryList = document.getElementById('log-history-list');
        logHistoryList.innerHTML = '';
        const dailyLogs = getData('dailyLogs');
        dailyLogs.slice().reverse().forEach((log: any) => {
            let details = '';
            if (currentFarmType === 'layers') {
                const totalCrates: number = log.eggs ? Object.values(log.eggs).reduce<number>((a, b) => a + Number(b || 0), 0) : 0;
                details = `<p>Total Eggs: <span>${totalCrates.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Crates</span></p><p>Feed Used: <span>${Number(log.feedUsed || 0).toLocaleString()} kg</span></p>`;
            } else if (currentFarmType === 'broilers') {
                details = `<p>Avg Weight: <span>${Number(log.avgWeight || 0).toLocaleString()} g</span></p><p>Feed Used: <span>${Number(log.feedUsed || 0).toLocaleString()} kg</span></p>`;
            } else { // Fish
                details = `<p>Avg Weight: <span>${log.avgWeight ? Number(log.avgWeight).toLocaleString() + ' g' : 'N/A'}</span></p><p>Feed Used: <span>${Number(log.feedUsed || 0).toLocaleString()} kg</span></p><p>Water pH: <span>${log.waterPH || 'N/A'}</span></p><p>Water Temp: <span>${log.waterTemp || 'N/A'}°C</span></p>`;
            }
            logHistoryList.innerHTML += `<li class="log-card"><div class="log-card-header"><h3>Date: ${formatDate(log.date)}</h3><button class="edit-btn" data-id="${log.id}">Edit</button></div><div class="log-card-body">${details}<p>Mortality: <span>${Number(log.mortality || 0).toLocaleString()}</span></p><p>Other Costs: <span>₦${Number(log.miscCost || 0).toLocaleString()}</span></p></div></li>`;
        });
    }

    function setupCostToggles() {
        document.querySelectorAll('.cost-toggle input[type="checkbox"]').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const checkbox = e.target as HTMLInputElement;
                const container = checkbox.closest('.cost-toggle').querySelector('.cost-input-container') as HTMLElement;
                if (container) {
                    container.style.display = checkbox.checked ? 'block' : 'none';
                    if (!checkbox.checked) { (container.querySelector('input[type="number"]') as HTMLInputElement).value = ''; }
                }
            });
        });
    }
    
    function setupAlertTypeToggle() {
        const alertPercentBtn = document.getElementById('alert-type-percent');
        const alertBagsBtn = document.getElementById('alert-type-bags');
        const alertPercentInputDiv = document.getElementById('alert-input-percent');
        const alertBagsInputDiv = document.getElementById('alert-input-bags');

        alertPercentBtn.addEventListener('click', () => { alertPercentBtn.classList.add('active'); alertBagsBtn.classList.remove('active'); alertPercentInputDiv.style.display = 'block'; alertBagsInputDiv.style.display = 'none'; });
        alertBagsBtn.addEventListener('click', () => { alertBagsBtn.classList.add('active'); alertPercentBtn.classList.remove('active'); alertBagsInputDiv.style.display = 'block'; alertPercentInputDiv.style.display = 'none'; });
    }

    // --- Initial Load ---
    currentFarmType = (localStorage.getItem('currentFarmType') as 'layers' | 'broilers' | 'fish') || 'layers';
    switchFarmTypeUI();
    setupCostToggles();
    setupAlertTypeToggle();

    if (localStorage.getItem('settingsSaved') === 'true') { showPage('page-dashboard'); }
    else { showPage('page-signin'); }
    
    // --- Event Listeners ---
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
    document.getElementById('add-egg-price-btn').addEventListener('click', () => { const newName = prompt('Enter new egg size name (e.g., Small):'); if (newName) addEggPriceRow(newName, 0); });
    modalSaveBtn.addEventListener('click', saveDailyLog);
    const closeModal = () => { modalOverlay.classList.remove('active'); dailyLogModal.classList.remove('active'); incomeLogModal.classList.remove('active');};
    modalCancelBtn.addEventListener('click', closeModal);
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('btn-show-modal').addEventListener('click', openModal);
    
    document.getElementById('btn-add-income').addEventListener('click', openIncomeModal);
    incomeModalSaveBtn.addEventListener('click', saveIncomeEntry);
    document.getElementById('income-modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('income-modal-cancel-btn').addEventListener('click', closeModal);
    ['income-category-layers', 'income-category-broilers', 'income-category-fish'].forEach(id => document.getElementById(id).addEventListener('change', updateIncomeQuantityLabel));
    
    document.getElementById('nav-to-dash-from-settings').addEventListener('click', (e) => { e.preventDefault(); showPage('page-dashboard'); });
    document.getElementById('nav-to-dash-from-feed').addEventListener('click', (e) => { e.preventDefault(); showPage('page-dashboard'); });
    document.getElementById('nav-to-dash-from-history').addEventListener('click', (e) => { e.preventDefault(); showPage('page-dashboard'); });
    document.getElementById('nav-to-dash-from-income').addEventListener('click', (e) => { e.preventDefault(); showPage('page-dashboard'); });
    signinBtn.addEventListener('click', () => showPage('page-settings'));
    navToSettingsFromDash.addEventListener('click', () => showPage('page-settings'));
    document.getElementById('btn-manage-feed').addEventListener('click', () => showPage('page-feed'));
    document.getElementById('btn-log-history').addEventListener('click', () => showPage('page-history'));
    document.getElementById('btn-income-ledger').addEventListener('click', () => showPage('page-income'));
    
    document.getElementById('income-filter-today').addEventListener('click', () => loadIncomeLedger('today'));
    document.getElementById('income-filter-week').addEventListener('click', () => loadIncomeLedger('week'));
    document.getElementById('income-filter-month').addEventListener('click', () => loadIncomeLedger('month'));
    document.getElementById('income-filter-all').addEventListener('click', () => loadIncomeLedger('all'));
    
    document.getElementById('save-feed-btn').addEventListener('click', () => {
        const purchase = { id: Date.now(), date: (document.getElementById('feed-date') as HTMLInputElement).value, bags: parseFloat((document.getElementById('feed-bags') as HTMLInputElement).value || '0'), weight: parseFloat((document.getElementById('feed-weight') as HTMLInputElement).value || '0'), cost: parseFloat((document.getElementById('feed-cost') as HTMLInputElement).value || '0'), };
        const purchases = JSON.parse(localStorage.getItem('shared_feedPurchases') || '[]');
        purchases.push(purchase);
        localStorage.setItem('shared_feedPurchases', JSON.stringify(purchases));
        alert('Feed purchase saved!');
        showPage('page-dashboard');
    });
});