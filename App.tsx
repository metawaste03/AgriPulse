import * as geminiService from './services/geminiService.ts';
import { FarmType } from './types.ts';

class App {
    private currentFarmType: FarmType = 'layers';
    private currentEditLogId: number | null = null;
    private currentEditIncomeId: number | null = null;
    
    // Element cache
    private elements: { [key: string]: HTMLElement | null } = {};

    init() {
        this.cacheDOMElements();
        this.setupEventListeners();
        this.loadInitialPage();
    }
    
    private cacheDOMElements() {
        const ids = [
            'signin-btn', 'nav-to-settings-from-dash', 'farm-type-layers', 'farm-type-broilers', 'farm-type-fish',
            'kpi-grid-layers', 'kpi-grid-broilers', 'kpi-grid-fish', 'settings-for-layers', 'settings-for-broilers',
            'settings-for-fish', 'modal-body-layers', 'modal-body-broilers', 'modal-body-fish', 'modal-overlay',
            'daily-log-modal', 'income-log-modal', 'modal-save-btn', 'modal-cancel-btn', 'income-modal-save-btn',
            'ai-advisor-messages', 'save-settings-btn', 'add-egg-price-btn', 'modal-close-btn', 'btn-show-modal',
            'btn-add-income', 'income-modal-close-btn', 'income-modal-cancel-btn', 'nav-to-dash-from-settings',
            'nav-to-dash-from-feed', 'nav-to-dash-from-history', 'nav-to-dash-from-income', 'btn-manage-feed',
            'btn-log-history', 'btn-income-ledger', 'income-filter-today', 'income-filter-week', 'income-filter-month',
            'income-filter-all', 'save-feed-btn', 'alert-type-percent', 'alert-type-bags', 'alert-input-percent', 'alert-input-bags',
            'feed-kpi-stock', 'feed-purchase-history-list'
        ];
        ids.forEach(id => this.elements[id] = document.getElementById(id));
    }
    
    private loadInitialPage() {
        this.currentFarmType = (localStorage.getItem('currentFarmType') as FarmType) || 'layers';
        this.switchFarmTypeUI();
        
        if (localStorage.getItem('settingsSaved') === 'true') {
            this.showPage('page-dashboard');
        } else {
            this.showPage('page-signin');
        }
    }

    private setupEventListeners() {
        this.elements['signin-btn']?.addEventListener('click', () => {
            this.showPage('page-settings');
        });

        // Farm Type Switcher
        this.elements['farm-type-layers']?.addEventListener('click', () => this.switchFarmType('layers'));
        this.elements['farm-type-broilers']?.addEventListener('click', () => this.switchFarmType('broilers'));
        this.elements['farm-type-fish']?.addEventListener('click', () => this.switchFarmType('fish'));
        
        // Navigation
        this.elements['nav-to-settings-from-dash']?.addEventListener('click', () => this.showPage('page-settings'));
        this.elements['btn-manage-feed']?.addEventListener('click', () => this.showPage('page-feed'));
        this.elements['btn-log-history']?.addEventListener('click', () => this.showPage('page-history'));
        this.elements['btn-income-ledger']?.addEventListener('click', () => this.showPage('page-income'));
        const backToDashLinks = ['nav-to-dash-from-settings', 'nav-to-dash-from-feed', 'nav-to-dash-from-history', 'nav-to-dash-from-income'];
        backToDashLinks.forEach(id => this.elements[id]?.addEventListener('click', (e) => { e.preventDefault(); this.showPage('page-dashboard'); }));

        // Settings Page
        this.elements['save-settings-btn']?.addEventListener('click', () => this.saveSettings());
        this.elements['add-egg-price-btn']?.addEventListener('click', () => { const newName = prompt('Enter new egg size name (e.g., Small):'); if (newName) this.addEggPriceRow(newName, 0); });
        this.setupCostToggles();
        this.setupAlertTypeToggle();

        // Modals
        const closeModal = () => {
            this.elements['modal-overlay']?.classList.remove('active');
            this.elements['daily-log-modal']?.classList.remove('active');
            this.elements['income-log-modal']?.classList.remove('active');
        };
        this.elements['btn-show-modal']?.addEventListener('click', () => this.openModal());
        this.elements['modal-save-btn']?.addEventListener('click', () => this.saveDailyLog());
        this.elements['modal-cancel-btn']?.addEventListener('click', closeModal);
        this.elements['modal-close-btn']?.addEventListener('click', closeModal);

        // Income
        this.elements['btn-add-income']?.addEventListener('click', () => this.openIncomeModal());
        this.elements['income-modal-save-btn']?.addEventListener('click', () => this.saveIncomeEntry());
        this.elements['income-modal-close-btn']?.addEventListener('click', closeModal);
        this.elements['income-modal-cancel-btn']?.addEventListener('click', closeModal);
        ['income-category-layers', 'income-category-broilers', 'income-category-fish'].forEach(id => document.getElementById(id)?.addEventListener('change', () => this.updateIncomeQuantityLabel()));
        
        // Income Filters
        this.elements['income-filter-today']?.addEventListener('click', () => this.loadIncomeLedger('today'));
        this.elements['income-filter-week']?.addEventListener('click', () => this.loadIncomeLedger('week'));
        this.elements['income-filter-month']?.addEventListener('click', () => this.loadIncomeLedger('month'));
        this.elements['income-filter-all']?.addEventListener('click', () => this.loadIncomeLedger('all'));

        // Feed Page
        this.elements['save-feed-btn']?.addEventListener('click', () => {
            const dateEl = document.getElementById('feed-date') as HTMLInputElement;
            const bagsEl = document.getElementById('feed-bags') as HTMLInputElement;
            const weightEl = document.getElementById('feed-weight') as HTMLInputElement;
            const costEl = document.getElementById('feed-cost') as HTMLInputElement;

            if (!dateEl.value || !weightEl.value || !costEl.value) {
                alert('Please fill in at least Date, Weight, and Cost.');
                return;
            }

            const purchase = { id: Date.now(), date: dateEl.value, bags: parseFloat(bagsEl.value || '0'), weight: parseFloat(weightEl.value || '0'), cost: parseFloat(costEl.value || '0'), };
            const purchases = JSON.parse(localStorage.getItem('shared_feedPurchases') || '[]');
            purchases.push(purchase);
            localStorage.setItem('shared_feedPurchases', JSON.stringify(purchases));
            alert('Feed purchase saved!');
            
            bagsEl.value = '';
            weightEl.value = '';
            costEl.value = '';

            this.loadFeedPage();
        });
    }

    // --- Helper Functions ---
    private getTodayDate = () => new Date().toISOString().split('T')[0];

    private parseDateString = (dateString: string): Date | null => {
        if (!dateString || typeof dateString !== 'string') return null;
        const parts = dateString.split('-');
        if (parts.length !== 3) return null;
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
        const date = new Date(year, month, day);
        if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
        return date;
    };

    private formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = this.parseDateString(dateString);
        if (!date) return dateString;
        return date.toLocaleDateString('en-GB');
    };

    private getStorageKey = (key: string) => `${this.currentFarmType}_${key}`;
    private getData = (key: string) => JSON.parse(localStorage.getItem(this.getStorageKey(key)) || '[]');
    private setData = (key: string, data: any) => localStorage.setItem(this.getStorageKey(key), JSON.stringify(data));

    private switchFarmType(newType: FarmType) {
        this.currentFarmType = newType;
        localStorage.setItem('currentFarmType', newType);
        this.switchFarmTypeUI();
        this.updateDashboard();
        if (document.getElementById('page-settings')?.classList.contains('active')) {
            this.loadSettings();
        }
    }

    private switchFarmTypeUI() {
        const isLayers = this.currentFarmType === 'layers';
        const isBroilers = this.currentFarmType === 'broilers';
        const isFish = this.currentFarmType === 'fish';

        this.elements['farm-type-layers']?.classList.toggle('active', isLayers);
        this.elements['farm-type-broilers']?.classList.toggle('active', isBroilers);
        this.elements['farm-type-fish']?.classList.toggle('active', isFish);

        this.elements['kpi-grid-layers']!.style.display = isLayers ? 'grid' : 'none';
        this.elements['kpi-grid-broilers']!.style.display = isBroilers ? 'grid' : 'none';
        this.elements['kpi-grid-fish']!.style.display = isFish ? 'grid' : 'none';

        this.elements['settings-for-layers']!.style.display = isLayers ? 'block' : 'none';
        this.elements['settings-for-broilers']!.style.display = isBroilers ? 'block' : 'none';
        this.elements['settings-for-fish']!.style.display = isFish ? 'block' : 'none';

        this.elements['modal-body-layers']!.style.display = isLayers ? 'block' : 'none';
        this.elements['modal-body-broilers']!.style.display = isBroilers ? 'block' : 'none';
        this.elements['modal-body-fish']!.style.display = isFish ? 'block' : 'none';
    }

    private showPage(pageId: string) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        const pageElement = document.getElementById(pageId);
        if (pageElement) {
            if (pageId === 'page-settings') this.loadSettings();
            else if (pageId === 'page-dashboard') this.updateDashboard();
            else if (pageId === 'page-feed') this.loadFeedPage();
            else if (pageId === 'page-history') this.loadLogHistory();
            else if (pageId === 'page-income') this.loadIncomeLedger();
            pageElement.classList.add('active');
        }
    }

    // --- Settings Logic ---
    private getSettings() {
        const sharedSettings = JSON.parse(localStorage.getItem('shared_settings') || '{}');
        const farmSettings = JSON.parse(localStorage.getItem(this.getStorageKey('settings')) || '{}');
        const dailyLogs = this.getData('dailyLogs');
        let initialStock = 0;
        if (this.currentFarmType === 'fish') {
            initialStock = parseFloat(farmSettings.initialQuantity || '0');
        } else {
            initialStock = parseFloat(farmSettings.initialBirds || '0');
        }
        
        const totalMortality = dailyLogs.reduce((sum: number, log: any) => sum + Number(log.mortality || 0), 0);
        
        return {
            ...sharedSettings, ...farmSettings, initialStock, currentStock: initialStock - totalMortality,
            dailyFixedCost: (parseFloat(sharedSettings.laborCost || 0) + parseFloat(sharedSettings.rentCost || 0) + parseFloat(sharedSettings.powerCost || 0) + parseFloat(sharedSettings.waterCost || 0) + parseFloat(sharedSettings.miscCost || 0)) / 30,
            feedAlertType: sharedSettings.feedAlertType || 'percentage',
            feedAlertValue: parseFloat(sharedSettings.feedAlertValue || (sharedSettings.feedAlertType === 'bags' ? '10' : '25')),
        };
    }

    private saveSettings() {
        const sharedSettings = {
            laborCost: (document.getElementById('labor-cost') as HTMLInputElement).value,
            rentCost: (document.getElementById('toggle-rent-cost') as HTMLInputElement).checked ? (document.getElementById('rent-cost') as HTMLInputElement).value : '0',
            powerCost: (document.getElementById('toggle-power-cost') as HTMLInputElement).checked ? (document.getElementById('power-cost') as HTMLInputElement).value : '0',
            waterCost: (document.getElementById('toggle-water-cost') as HTMLInputElement).checked ? (document.getElementById('water-cost') as HTMLInputElement).value : '0',
            miscCost: (document.getElementById('toggle-misc-cost') as HTMLInputElement).checked ? (document.getElementById('misc-cost') as HTMLInputElement).value : '0',
            feedAlertType: this.elements['alert-type-percent']?.classList.contains('active') ? 'percentage' : 'bags',
            feedAlertValue: this.elements['alert-type-percent']?.classList.contains('active') ? (document.getElementById('feed-alert-value-percent') as HTMLInputElement).value : (document.getElementById('feed-alert-value-bags') as HTMLInputElement).value,
        };
        localStorage.setItem('shared_settings', JSON.stringify(sharedSettings));

        let farmSettings = {};
        if (this.currentFarmType === 'layers') {
            farmSettings = { initialBirds: (document.getElementById('initial-birds-layers') as HTMLInputElement).value, flockStartDate: (document.getElementById('flock-start-date-layers') as HTMLInputElement).value, showFlockAge: (document.getElementById('toggle-show-flock-age-layers') as HTMLInputElement).checked, };
            let eggPrices: {name: string, price: number}[] = [];
            document.querySelectorAll('#egg-prices-list input[type="number"]').forEach(input => {
                const inp = input as HTMLInputElement;
                eggPrices.push({ name: inp.dataset.name!, price: parseFloat(inp.value || '0') });
            });
            this.setData('eggPrices', eggPrices);
        } else if (this.currentFarmType === 'broilers') {
            farmSettings = { initialBirds: (document.getElementById('initial-birds-broilers') as HTMLInputElement).value, flockStartDate: (document.getElementById('flock-start-date-broilers') as HTMLInputElement).value, showFlockAge: (document.getElementById('toggle-show-flock-age-broilers') as HTMLInputElement).checked, targetWeight: (document.getElementById('target-weight') as HTMLInputElement).value, };
        } else {
            farmSettings = { fishType: (document.getElementById('fish-type') as HTMLInputElement).value, stockingDate: (document.getElementById('stocking-date') as HTMLInputElement).value, initialQuantity: (document.getElementById('initial-fish-quantity') as HTMLInputElement).value, initialAvgWeight: (document.getElementById('initial-fish-avg-weight') as HTMLInputElement).value, };
        }
        localStorage.setItem(this.getStorageKey('settings'), JSON.stringify(farmSettings));
        
        localStorage.setItem('settingsSaved', 'true');
        alert('Settings Saved!');
        this.showPage('page-dashboard');
    }

    private loadCostToggle(checkboxId: string, inputId: string, value: string) {
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

    private loadSettings() {
        const sharedSettings = JSON.parse(localStorage.getItem('shared_settings') || '{}');
        const farmSettings = JSON.parse(localStorage.getItem(this.getStorageKey('settings')) || '{}');

        (document.getElementById('labor-cost') as HTMLInputElement).value = sharedSettings.laborCost || '';
        this.loadCostToggle('toggle-rent-cost', 'rent-cost', sharedSettings.rentCost);
        this.loadCostToggle('toggle-power-cost', 'power-cost', sharedSettings.powerCost);
        this.loadCostToggle('toggle-water-cost', 'water-cost', sharedSettings.waterCost);
        this.loadCostToggle('toggle-misc-cost', 'misc-cost', sharedSettings.miscCost);
        
        const feedAlertType = sharedSettings.feedAlertType || 'percentage';
        this.elements['alert-type-percent']?.classList.toggle('active', feedAlertType === 'percentage');
        this.elements['alert-type-bags']?.classList.toggle('active', feedAlertType === 'bags');
        this.elements['alert-input-percent']!.style.display = feedAlertType === 'percentage' ? 'block' : 'none';
        this.elements['alert-input-bags']!.style.display = feedAlertType === 'bags' ? 'block' : 'none';
        (document.getElementById('feed-alert-value-percent') as HTMLInputElement).value = sharedSettings.feedAlertValue || '25';
        (document.getElementById('feed-alert-value-bags') as HTMLInputElement).value = sharedSettings.feedAlertValue || '10';

        if (this.currentFarmType === 'layers') {
            (document.getElementById('initial-birds-layers') as HTMLInputElement).value = farmSettings.initialBirds || '';
            (document.getElementById('flock-start-date-layers') as HTMLInputElement).value = farmSettings.flockStartDate || '';
            (document.getElementById('toggle-show-flock-age-layers') as HTMLInputElement).checked = !!farmSettings.showFlockAge;
            const eggPrices = this.getData('eggPrices');
            const eggPricesList = document.getElementById('egg-prices-list')!;
            eggPricesList.innerHTML = '';
            if (eggPrices.length === 0) { ['Jumbo', 'Large', 'Pullet'].forEach((name:string) => this.addEggPriceRow(name, 0)); }
            else { eggPrices.forEach((egg: any) => this.addEggPriceRow(egg.name, egg.price)); }
        } else if (this.currentFarmType === 'broilers') {
            (document.getElementById('initial-birds-broilers') as HTMLInputElement).value = farmSettings.initialBirds || '';
            (document.getElementById('flock-start-date-broilers') as HTMLInputElement).value = farmSettings.flockStartDate || '';
            (document.getElementById('toggle-show-flock-age-broilers') as HTMLInputElement).checked = !!farmSettings.showFlockAge;
            (document.getElementById('target-weight') as HTMLInputElement).value = farmSettings.targetWeight || '';
        } else {
            (document.getElementById('fish-type') as HTMLInputElement).value = farmSettings.fishType || '';
            (document.getElementById('stocking-date') as HTMLInputElement).value = farmSettings.stockingDate || '';
            (document.getElementById('initial-fish-quantity') as HTMLInputElement).value = farmSettings.initialQuantity || '';
            (document.getElementById('initial-fish-avg-weight') as HTMLInputElement).value = farmSettings.initialAvgWeight || '';
        }
    }
    
    private addEggPriceRow(name: string, price: number) {
        const eggPricesList = document.getElementById('egg-prices-list')!;
        const row = document.createElement('div');
        row.className = 'dynamic-price-row';
        row.innerHTML = `<label>${name}</label><input type="number" value="${price || ''}" placeholder="0" data-name="${name}">`;
        eggPricesList.appendChild(row);
    }
    
    private setupCostToggles() {
        document.querySelectorAll('.cost-toggle input[type="checkbox"]').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const checkbox = e.target as HTMLInputElement;
                const container = checkbox.closest('.cost-toggle')?.querySelector('.cost-input-container') as HTMLElement;
                if (container) {
                    container.style.display = checkbox.checked ? 'block' : 'none';
                    if (!checkbox.checked) { (container.querySelector('input[type="number"]') as HTMLInputElement).value = ''; }
                }
            });
        });
    }
    
    private setupAlertTypeToggle() {
        this.elements['alert-type-percent']?.addEventListener('click', () => {
            this.elements['alert-type-percent']?.classList.add('active');
            this.elements['alert-type-bags']?.classList.remove('active');
            this.elements['alert-input-percent']!.style.display = 'block';
            this.elements['alert-input-bags']!.style.display = 'none';
        });
        this.elements['alert-type-bags']?.addEventListener('click', () => {
            this.elements['alert-type-bags']?.classList.add('active');
            this.elements['alert-type-percent']?.classList.remove('active');
            this.elements['alert-input-bags']!.style.display = 'block';
            this.elements['alert-input-percent']!.style.display = 'none';
        });
    }

    // --- Modal Logic ---
    private openModal() {
        this.currentEditLogId = null;
        (document.getElementById('modal-title') as HTMLElement).textContent = "Add Daily Log";
        const { currentStock } = this.getSettings();
        document.querySelectorAll('.mortality-start-total').forEach(el => el.textContent = currentStock.toLocaleString());
        document.querySelectorAll('.log-mortality').forEach(el => (el as HTMLInputElement).value = '');
        document.querySelectorAll('.mortality-new-total').forEach(el => el.textContent = currentStock.toLocaleString());
        
        if (this.currentFarmType === 'layers') {
            (document.getElementById('log-date-layers') as HTMLInputElement).value = this.getTodayDate();
            const eggPrices = this.getData('eggPrices');
            const modalEggInputs = document.getElementById('modal-egg-inputs')!;
            modalEggInputs.innerHTML = '';
            eggPrices.forEach((egg: any) => {
                modalEggInputs.innerHTML += `<div class="egg-input-group"><label>${egg.name}</label><div class="egg-input-row"><div><label>Crates</label><input type="number" id="log-eggs-crates-${egg.name}" data-name="${egg.name}" placeholder="0"></div><div><label>Eggs</label><input type="number" id="log-eggs-loose-${egg.name}" data-name="${egg.name}" placeholder="0"></div></div></div>`;
            });
        } else if (this.currentFarmType === 'broilers') {
            (document.getElementById('log-date-broilers') as HTMLInputElement).value = this.getTodayDate();
        } else {
            (document.getElementById('log-date-fish') as HTMLInputElement).value = this.getTodayDate();
        }

        this.elements['modal-overlay']?.classList.add('active');
        this.elements['daily-log-modal']?.classList.add('active');
    }

    private saveDailyLog() {
        let logEntry: any = { id: this.currentEditLogId || Date.now() };
        
        if(this.currentFarmType === 'layers') {
            let eggsData: { [key: string]: number } = {};
            this.getData('eggPrices').forEach((egg: any) => {
                const crates = parseFloat((document.getElementById(`log-eggs-crates-${egg.name}`) as HTMLInputElement).value || '0');
                const loose = parseFloat((document.getElementById(`log-eggs-loose-${egg.name}`) as HTMLInputElement).value || '0');
                eggsData[egg.name] = crates + (loose / 30);
            });
            logEntry = { ...logEntry, date: (document.getElementById('log-date-layers') as HTMLInputElement).value, mortality: parseFloat((this.elements['modal-body-layers']?.querySelector('.log-mortality') as HTMLInputElement).value || '0'), eggs: eggsData, feedUsed: parseFloat((document.getElementById('log-feed-layers') as HTMLInputElement).value || '0'), miscCost: parseFloat((document.getElementById('log-misc-cost-layers') as HTMLInputElement).value || '0'), };
        } else if (this.currentFarmType === 'broilers') {
            logEntry = { ...logEntry, date: (document.getElementById('log-date-broilers') as HTMLInputElement).value, mortality: parseFloat((this.elements['modal-body-broilers']?.querySelector('.log-mortality') as HTMLInputElement).value || '0'), avgWeight: parseFloat((document.getElementById('log-avg-weight') as HTMLInputElement).value || '0'), feedType: (document.getElementById('log-feed-type') as HTMLInputElement).value, feedUsed: parseFloat((document.getElementById('log-feed-broilers') as HTMLInputElement).value || '0'), miscCost: parseFloat((document.getElementById('log-misc-cost-broilers') as HTMLInputElement).value || '0'), };
        } else {
            logEntry = { ...logEntry, date: (document.getElementById('log-date-fish') as HTMLInputElement).value, mortality: parseFloat((this.elements['modal-body-fish']?.querySelector('.log-mortality') as HTMLInputElement).value || '0'), avgWeight: parseFloat((document.getElementById('log-avg-weight-fish') as HTMLInputElement).value || '0'), feedUsed: parseFloat((document.getElementById('log-feed-fish') as HTMLInputElement).value || '0'), waterPH: parseFloat((document.getElementById('log-water-ph') as HTMLInputElement).value || '0'), waterTemp: parseFloat((document.getElementById('log-water-temp') as HTMLInputElement).value || '0'), miscCost: parseFloat((document.getElementById('log-misc-cost-fish') as HTMLInputElement).value || '0'), };
        }
        
        let dailyLogs = this.getData('dailyLogs');
        if (this.currentEditLogId) {
            const index = dailyLogs.findIndex((log: any) => log.id == this.currentEditLogId);
            if (index > -1) dailyLogs[index] = logEntry;
        } else {
            dailyLogs.push(logEntry);
        }
        dailyLogs.sort((a: any, b: any) => (this.parseDateString(a.date)?.getTime() || 0) - (this.parseDateString(b.date)?.getTime() || 0));
        this.setData('dailyLogs', dailyLogs);

        this.elements['modal-overlay']?.classList.remove('active');
        this.elements['daily-log-modal']?.classList.remove('active');
        this.updateDashboard();
    }

    // --- Income Logic ---
    private openIncomeModal() {
        this.currentEditIncomeId = null;
        (document.getElementById('income-modal-title') as HTMLElement).textContent = "Add Income Entry";
        (document.getElementById('income-date') as HTMLInputElement).value = this.getTodayDate();
        (document.getElementById('income-quantity') as HTMLInputElement).value = '';
        (document.getElementById('income-weight') as HTMLInputElement).value = '';
        (document.getElementById('income-amount') as HTMLInputElement).value = '';
        (document.getElementById('income-notes') as HTMLTextAreaElement).value = '';
        
        (document.getElementById('income-category-layers') as HTMLElement).style.display = this.currentFarmType === 'layers' ? 'block' : 'none';
        (document.getElementById('income-category-broilers') as HTMLElement).style.display = this.currentFarmType === 'broilers' ? 'block' : 'none';
        (document.getElementById('income-category-fish') as HTMLElement).style.display = this.currentFarmType === 'fish' ? 'block' : 'none';
        this.updateIncomeQuantityLabel();

        this.elements['modal-overlay']?.classList.add('active');
        this.elements['income-log-modal']?.classList.add('active');
    }

    private saveIncomeEntry() {
        let category: string;
        if(this.currentFarmType === 'layers') category = (document.getElementById('income-category-layers') as HTMLSelectElement).value;
        else if (this.currentFarmType === 'broilers') category = (document.getElementById('income-category-broilers') as HTMLSelectElement).value;
        else category = (document.getElementById('income-category-fish') as HTMLSelectElement).value;

        const incomeEntry = { id: this.currentEditIncomeId || Date.now(), date: (document.getElementById('income-date') as HTMLInputElement).value, category, quantity: parseFloat((document.getElementById('income-quantity') as HTMLInputElement).value || '0'), weight: parseFloat((document.getElementById('income-weight') as HTMLInputElement).value || '0'), amount: parseFloat((document.getElementById('income-amount') as HTMLInputElement).value || '0'), notes: (document.getElementById('income-notes') as HTMLTextAreaElement).value, };

        let incomeEntries = this.getData('incomeEntries');
        if (this.currentEditIncomeId) {
            const index = incomeEntries.findIndex((entry: any) => entry.id == this.currentEditIncomeId);
            if(index > -1) incomeEntries[index] = incomeEntry;
        } else {
            incomeEntries.push(incomeEntry);
        }
        this.setData('incomeEntries', incomeEntries);
        
        this.elements['modal-overlay']?.classList.remove('active');
        this.elements['income-log-modal']?.classList.remove('active');
        this.loadIncomeLedger();
    }
    
    private updateIncomeQuantityLabel() {
        let category: string;
        if(this.currentFarmType === 'layers') category = (document.getElementById('income-category-layers') as HTMLSelectElement).value;
        else if (this.currentFarmType === 'broilers') category = (document.getElementById('income-category-broilers') as HTMLSelectElement).value;
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

    private loadIncomeLedger(filter: 'today' | 'week' | 'month' | 'all' = 'today') {
        const incomeEntries = this.getData('incomeEntries');
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
        const filteredEntries = incomeEntries.filter((entry: any) => {
            const entryDate = this.parseDateString(entry.date);
            if (!entryDate) return false;
            if (filter === 'today') return entryDate.getTime() === today.getTime();
            if (filter === 'week') return entryDate >= weekStart;
            if (filter === 'month') return entryDate >= monthStart;
            return true;
        });
    
        const totalRevenue = filteredEntries.reduce((sum: number, entry: any) => sum + Number(entry.amount || 0), 0);
        (document.getElementById('income-summary-revenue') as HTMLElement).textContent = `₦${totalRevenue.toLocaleString()}`;
        (document.getElementById('income-summary-count') as HTMLElement).textContent = filteredEntries.length.toLocaleString();
        
        const historyList = document.getElementById('income-history-list')!;
        historyList.innerHTML = filteredEntries.length === 0 ? '<p>No income entries for this period.</p>' : '';
    
        filteredEntries.slice().reverse().forEach((entry: any) => {
            historyList.innerHTML += `<li class="log-card"><div class="log-card-header"><h3>${this.formatDate(entry.date)} - ${entry.category}</h3><span style="font-size: 1.5rem; color: var(--brand-positive); font-weight: bold;">+₦${Number(entry.amount || 0).toLocaleString()}</span></div><div class="log-card-body"><p>Quantity: <span>${Number(entry.quantity || 0).toLocaleString()}</span></p>${entry.weight > 0 ? `<p>Weight: <span>${Number(entry.weight).toLocaleString()} kg</span></p>` : ''}</div>${entry.notes ? `<p style="margin-top: 1rem; font-style: italic;">Note: ${entry.notes}</p>` : ''}</li>`;
        });
        
        document.querySelectorAll('#page-income .filter-toggle button').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`income-filter-${filter}`)?.classList.add('active');
    }
    
    private loadLogHistory() {
        const logHistoryList = document.getElementById('log-history-list')!;
        logHistoryList.innerHTML = '';
        const dailyLogs = this.getData('dailyLogs');
        dailyLogs.slice().reverse().forEach((log: any) => {
            let details = '';
            if (this.currentFarmType === 'layers') {
                const totalCrates: number = log.eggs ? Object.values(log.eggs).reduce<number>((a, b) => a + Number(b || 0), 0) : 0;
                details = `<p>Total Eggs: <span>${totalCrates.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Crates</span></p><p>Feed Used: <span>${Number(log.feedUsed || 0).toLocaleString()} kg</span></p>`;
            } else if (this.currentFarmType === 'broilers') {
                details = `<p>Avg Weight: <span>${Number(log.avgWeight || 0).toLocaleString()} g</span></p><p>Feed Used: <span>${Number(log.feedUsed || 0).toLocaleString()} kg</span></p>`;
            } else { // Fish
                details = `<p>Avg Weight: <span>${log.avgWeight ? Number(log.avgWeight).toLocaleString() + ' g' : 'N/A'}</span></p><p>Feed Used: <span>${Number(log.feedUsed || 0).toLocaleString()} kg</span></p><p>Water pH: <span>${log.waterPH || 'N/A'}</span></p><p>Water Temp: <span>${log.waterTemp || 'N/A'}°C</span></p>`;
            }
            logHistoryList.innerHTML += `<li class="log-card"><div class="log-card-header"><h3>Date: ${this.formatDate(log.date)}</h3><button class="edit-btn" data-id="${log.id}">Edit</button></div><div class="log-card-body">${details}<p>Mortality: <span>${Number(log.mortality || 0).toLocaleString()}</span></p><p>Other Costs: <span>₦${Number(log.miscCost || 0).toLocaleString()}</span></p></div></li>`;
        });
    }

    // --- Feed Logic ---
    private getFeedStock() {
        const feedPurchases = JSON.parse(localStorage.getItem('shared_feedPurchases') || '[]');
        const allLogsLayers = JSON.parse(localStorage.getItem('layers_dailyLogs') || '[]');
        const allLogsBroilers = JSON.parse(localStorage.getItem('broilers_dailyLogs') || '[]');
        const allLogsFish = JSON.parse(localStorage.getItem('fish_dailyLogs') || '[]');
        
        const totalFeedBought = feedPurchases.reduce((sum: number, item: any) => sum + Number(item.weight || 0), 0);
        const totalFeedUsed = [...allLogsLayers, ...allLogsBroilers, ...allLogsFish].reduce((sum: number, item: any) => sum + Number(item.feedUsed || 0), 0);
        const feedInStock = totalFeedBought - totalFeedUsed;
        return { feedInStock, totalFeedBought };
    }

    private loadFeedPage() {
        (document.getElementById('feed-date') as HTMLInputElement).value = this.getTodayDate();

        const { feedInStock } = this.getFeedStock();
        (this.elements['feed-kpi-stock'] as HTMLElement).textContent = `${feedInStock.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} kg`;

        const feedPurchases = JSON.parse(localStorage.getItem('shared_feedPurchases') || '[]');
        const historyList = this.elements['feed-purchase-history-list'] as HTMLUListElement;
        historyList.innerHTML = '';
        
        if (feedPurchases.length === 0) {
            historyList.innerHTML = '<p>No feed purchases logged yet.</p>';
            return;
        }

        feedPurchases.sort((a: any, b: any) => (this.parseDateString(b.date)?.getTime() || 0) - (this.parseDateString(a.date)?.getTime() || 0));

        feedPurchases.forEach((purchase: any) => {
            const card = document.createElement('li');
            card.className = 'log-card';
            card.innerHTML = `
                <div class="log-card-header">
                    <h3>Purchase Date: ${this.formatDate(purchase.date)}</h3>
                    <button class="btn secondary-btn" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;" data-id="${purchase.id}">Delete</button>
                </div>
                <div class="log-card-body">
                    <p>Weight: <span>${Number(purchase.weight || 0).toLocaleString()} kg</span></p>
                    <p>Bags: <span>${Number(purchase.bags || 0).toLocaleString()}</span></p>
                    <p>Total Cost: <span>₦${Number(purchase.cost || 0).toLocaleString()}</span></p>
                </div>
            `;
            historyList.appendChild(card);
        });

        historyList.querySelectorAll('button[data-id]').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = (e.currentTarget as HTMLElement).dataset.id;
                if (id && confirm('Are you sure you want to delete this purchase entry?')) {
                    this.deleteFeedPurchase(parseInt(id, 10));
                }
            });
        });
    }

    private deleteFeedPurchase(id: number) {
        let purchases = JSON.parse(localStorage.getItem('shared_feedPurchases') || '[]');
        purchases = purchases.filter((p: any) => p.id !== id);
        localStorage.setItem('shared_feedPurchases', JSON.stringify(purchases));
        this.loadFeedPage();
    }

    // --- Dashboard Logic ---
    private updateFlockAgeKPI(settings: any): number {
        const flockAgeCard = document.getElementById(`kpi-card-flock-age-${this.currentFarmType}`);
        const flockAgeValue = document.getElementById(`kpi-flock-age-${this.currentFarmType}`);
        let flockAge = 0;
    
        if (flockAgeCard && flockAgeValue && settings.showFlockAge && settings.flockStartDate) {
            const startDate = this.parseDateString(settings.flockStartDate);
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
    
    private updateDashboard() {
        if (!this.elements['ai-advisor-messages']) return;
        this.elements['ai-advisor-messages'].innerHTML = '<p>Loading smart advice...</p>';

        if (this.currentFarmType === 'layers') this.updateLayersDashboard();
        else if (this.currentFarmType === 'broilers') this.updateBroilersDashboard();
        else this.updateFishDashboard();
    }

    private updateLayersDashboard() {
        const settings = this.getSettings();
        const flockAge = this.updateFlockAgeKPI(settings);
        const eggPrices = this.getData('eggPrices');
        const dailyLogs = this.getData('dailyLogs');
        const incomeEntries = this.getData('incomeEntries');
        const todayLog = dailyLogs.find((log: any) => log.date === this.getTodayDate()) || {};

        const { feedInStock, totalFeedBought } = this.getFeedStock();
        const feedPurchases = JSON.parse(localStorage.getItem('shared_feedPurchases') || '[]');
        const avgFeedCostPerKg = totalFeedBought > 0 ? feedPurchases.reduce((s:number, i:any) => s + Number(i.cost||0), 0) / totalFeedBought : 0;
        
        let eggSaleRevenue = 0;
        if (todayLog.eggs) {
            eggPrices.forEach((egg: { name: string, price: number}) => { eggSaleRevenue += (todayLog.eggs[egg.name] || 0) * egg.price; });
        }
        const incomeToday = incomeEntries.filter((i: any) => i.date === this.getTodayDate()).reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);
        
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

        const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const last7DaysLogs = dailyLogs.filter((log: any) => { const logDate = this.parseDateString(log.date); return logDate && logDate >= sevenDaysAgo; });
        const totalMortality7d = last7DaysLogs.reduce((sum: number, log: any) => sum + Number(log.mortality || 0), 0);
        const totalLayingCapacitySum = last7DaysLogs.reduce((sum: number, log: any) => { const totalCrates: number = log.eggs ? Object.values(log.eggs).reduce<number>((a, b) => a + Number(b || 0), 0) : 0; const dayCapacity = settings.currentStock > 0 ? (totalCrates * 30 / settings.currentStock) * 100 : 0; return sum + dayCapacity; }, 0);
        const avgLayingCapacity7d = last7DaysLogs.length > 0 ? totalLayingCapacitySum / last7DaysLogs.length : layingCapacity;
        
        const farmData = { initialBirds: settings.initialStock, currentBirds: settings.currentStock, flockAge, ...settings, feedInStock, bagsInStock: feedInStock / 25, feedStockPercentage: totalFeedBought > 0 ? (feedInStock / totalFeedBought) * 100 : 0, todayLog, layingCapacity, mortalityRate: settings.currentStock > 0 && todayLog.mortality ? (todayLog.mortality / settings.currentStock) * 100 : 0, fcr, incomeToday, profit, avgLayingCapacity7d, totalMortality7d, };
        const adviceMessages = geminiService.getLayerAIAdvice(farmData);
        this.displayAdvice(adviceMessages);
    }
    
    private updateBroilersDashboard() {
        const settings = this.getSettings();
        const flockAge = this.updateFlockAgeKPI(settings);
        const dailyLogs = this.getData('dailyLogs');
        const incomeEntries = this.getData('incomeEntries');
        const todayLog = dailyLogs.find((log: any) => log.date === this.getTodayDate()) || {};
        const yesterdayLog = dailyLogs.find((log: any) => log.date === new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0]) || {};

        const { feedInStock } = this.getFeedStock();
        
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
        
        const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const last7DaysLogs = dailyLogs.filter((log: any) => { const logDate = this.parseDateString(log.date); return logDate && logDate >= sevenDaysAgo; });
        const totalMortality7d = last7DaysLogs.reduce((sum: number, log: any) => sum + Number(log.mortality || 0), 0);
        const incomeToday = incomeEntries.filter((i: any) => i.date === this.getTodayDate()).reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);

        const farmData = { initialBirds: settings.initialStock, currentBirds: settings.currentStock, flockAge, ...settings, feedInStock, bagsInStock: feedInStock / 25, todayLog, adg, mortalityRate, fcr, totalMortality7d, incomeToday, };
        const adviceMessages = geminiService.getBroilerAIAdvice(farmData);
        this.displayAdvice(adviceMessages);
    }

    private updateFishDashboard() {
        const settings = this.getSettings();
        const dailyLogs = this.getData('dailyLogs');
        const todayLog = dailyLogs.find((log: any) => log.date === this.getTodayDate()) || {};
        
        const weightLogs = dailyLogs.filter((log: any) => log.avgWeight > 0).sort((a: any, b: any) => (this.parseDateString(a.date)?.getTime() || 0) - (this.parseDateString(b.date)?.getTime() || 0));
        const latestWeightLog = weightLogs[weightLogs.length - 1] || {};
        const previousWeightLog = weightLogs[weightLogs.length - 2] || {};
        
        let daysSinceStocking = 0;
        if(settings.stockingDate){
            const stockingDate = this.parseDateString(settings.stockingDate);
            if (stockingDate) daysSinceStocking = Math.floor((new Date().getTime() - stockingDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        const latestAvgWeight = parseFloat(latestWeightLog.avgWeight || settings.initialAvgWeight || '0');
        const totalBiomass = (settings.currentStock * latestAvgWeight) / 1000;
        const weightGain = latestAvgWeight - parseFloat(previousWeightLog.avgWeight || settings.initialAvgWeight || '0');
        
        const latestDate = this.parseDateString(latestWeightLog.date);
        const previousDate = this.parseDateString(previousWeightLog.date);
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
        const adviceMessages = geminiService.getFishAIAdvice(farmData);
        this.displayAdvice(adviceMessages);
    }

    private displayAdvice(adviceMessages: any[]) {
        const container = this.elements['ai-advisor-messages'];
        if (!container) return;
        container.innerHTML = '';
        if (adviceMessages && adviceMessages.length > 0) {
            adviceMessages.forEach(msg => {
                const card = document.createElement('div');
                card.className = `advisor-card ${msg.type}`;
                card.textContent = msg.message;
                card.style.display = 'block';
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<div class="advisor-card positive" style.display:block;">All metrics look good! Keep up the great work.</div>';
        }
    }
}

export default App;