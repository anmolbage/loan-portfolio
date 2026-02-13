// Loan Portfolio PWA - Complete Application
// Database Setup
const db = new Dexie('LoanPortfolioDB');
db.version(1).stores({
    accounts: 'accountNumber,cif,loanType,irac,riskLevel,status,assignedTo,nextFollowup',
    timeline: '++id,accountNumber,timestamp,userName',
    users: 'userId,name,role',
    deposits: 'accountNumber,cif',
    settings: 'key'
});

// Global App State
const app = {
    currentUser: null,
    currentAccount: null,
    currentView: 'dashboard',
    currentFilter: 'all',
    currentSort: 'overdue-desc',
    branchContact: '9234567890',
    accounts: [],
    
    // Initialize App
    async init() {
        await this.loadSettings();
        await this.checkAuth();
        if (this.currentUser) {
            await this.loadData();
            this.showScreen('appScreen');
            this.updateDashboard();
        } else {
            this.showScreen('loginScreen');
        }
        this.registerServiceWorker();
    },
    
    // Authentication
    async login() {
        const role = document.getElementById('loginUser').value;
        const pin = document.getElementById('loginPin').value;
        if (!role || !pin || pin.length !== 4) {
            alert('Please select user and enter 4-digit PIN');
            return;
        }
        // Simple PIN check (default: 1234 for all users)
        if (pin === '1234') {
            this.currentUser = {userId: role, name: role, role: role};
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            await this.loadData();
            this.showScreen('appScreen');
            document.getElementById('userName').textContent = role;
            this.updateDashboard();
        } else {
            alert('Invalid PIN. Default PIN is 1234');
        }
    },
    
    logout() {
        if (confirm('Logout from app?')) {
            this.currentUser = null;
            localStorage.removeItem('currentUser');
            this.showScreen('loginScreen');
            document.getElementById('loginPin').value = '';
        }
    },
    
    async checkAuth() {
        const user = localStorage.getItem('currentUser');
        if (user) {
            this.currentUser = JSON.parse(user);
            document.getElementById('userName').textContent = this.currentUser.name;
        }
    },
    
    // View Management
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    },
    
    switchView(viewName) {
        this.currentView = viewName;
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewName + 'View').classList.add('active');

        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const navItems = document.querySelectorAll('.nav-item');
        const viewOrder = ['dashboard', 'accounts', 'import', 'settings'];
        const idx = viewOrder.indexOf(viewName);
        if (idx >= 0 && navItems[idx]) navItems[idx].classList.add('active');

        if (viewName === 'dashboard') this.updateDashboard();
        if (viewName === 'accounts') this.loadAccountsList();
    },
    
    // Data Loading
    async loadData() {
        this.accounts = await db.accounts.toArray();
        console.log(`Loaded ${this.accounts.length} accounts`);
    },
    
    // Dashboard Updates
    async updateDashboard() {
        const active = this.accounts.filter(a => a.status === 'Active');
        const tl = active.filter(a => a.loanType === 'TL');
        const ccod = active.filter(a => a.loanType === 'CCOD');
        
        document.getElementById('totalAccounts').textContent = active.length;
        document.getElementById('tlCount').textContent = tl.length;
        document.getElementById('ccodCount').textContent = ccod.length;
        
        const totalOut = active.reduce((sum, a) => sum + (a.outstanding || 0), 0);
        document.getElementById('totalOutstanding').textContent = this.formatCurrency(totalOut);
        
        const totalArr = tl.reduce((sum, a) => sum + (a.arrear || 0), 0);
        document.getElementById('totalArrear').textContent = this.formatCurrency(totalArr);
        
        const totalInt = ccod.reduce((sum, a) => sum + (a.interestDue || 0), 0);
        document.getElementById('totalInterest').textContent = this.formatCurrency(totalInt);
        
        const highRisk = active.filter(a => a.riskLevel === 'HIGH').length;
        document.getElementById('highRiskCount').textContent = highRisk;
        
        document.getElementById('sma0Count').textContent = active.filter(a => a.irac === 1).length;
        document.getElementById('sma1Count').textContent = active.filter(a => a.irac === 2).length;
        document.getElementById('sma2Count').textContent = active.filter(a => a.irac === 3).length;
        document.getElementById('npaCount').textContent = active.filter(a => a.irac >= 4).length;
        
        const recoverable = active.filter(a => a.recoverable === true);
        document.getElementById('recoverableCount').textContent = recoverable.length;
        const recAmt = recoverable.reduce((sum, a) => sum + (a.arrear || a.interestDue || 0), 0);
        document.getElementById('recoverableAmount').textContent = this.formatCurrency(recAmt);
        
        const missingData = active.filter(a => !a.mobile || !a.linkedSBAccount).length;
        document.getElementById('missingDataCount').textContent = missingData;
        
        const lastImport = localStorage.getItem('lastImportDate');
        document.getElementById('lastUpdate').textContent = lastImport || 'Never';
        
        this.loadTodayFollowups();
    },
    
    async loadTodayFollowups() {
        const today = new Date().toISOString().split('T')[0];
        const followups = this.accounts.filter(a => 
            a.nextFollowup && a.nextFollowup.startsWith(today) && a.status === 'Active'
        );
        
        const container = document.getElementById('todayFollowups');
        if (followups.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✅</div><div class="empty-state-text">No followups scheduled for today</div></div>';
        } else {
            container.innerHTML = followups.map(a => this.renderAccountCard(a)).join('');
        }
    },
    
    // Account List
    async loadAccountsList() {
        let filtered = this.accounts.filter(a => a.status === 'Active');
        
        if (this.currentFilter === 'high-risk') filtered = filtered.filter(a => a.riskLevel === 'HIGH');
        if (this.currentFilter === 'sma2') filtered = filtered.filter(a => a.irac === 3);
        if (this.currentFilter === 'npa') filtered = filtered.filter(a => a.irac >= 4);
        if (this.currentFilter === 'recoverable') filtered = filtered.filter(a => a.recoverable === true);
        if (this.currentFilter === 'missing-data') filtered = filtered.filter(a => !a.mobile || !a.linkedSBAccount);

        if (this.currentSort === 'overdue-desc') {
            filtered.sort((a, b) => (b.arrear || b.interestDue || 0) - (a.arrear || a.interestDue || 0));
        } else if (this.currentSort === 'outstanding-desc') {
            filtered.sort((a, b) => (b.outstanding || 0) - (a.outstanding || 0));
        }
        
        const container = document.getElementById('accountsList');
        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">No accounts found</div></div>';
        } else {
            container.innerHTML = filtered.map(a => this.renderAccountCard(a)).join('');
        }
    },
    
    updateSort(sortBy) {
        this.currentSort = sortBy;
        this.loadAccountsList();
    },

    filterAccounts(filter, evt) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        const target = evt ? evt.target : (event ? event.target : null);
        if (target) target.classList.add('active');
        this.loadAccountsList();
    },
    
    searchAccounts() {
        const query = document.getElementById('searchInput').value.toLowerCase();
        if (!query) {
            this.loadAccountsList();
            return;
        }
        
        const results = this.accounts.filter(a => 
            a.status === 'Active' && (
                a.accountNumber.toLowerCase().includes(query) ||
                a.customerName.toLowerCase().includes(query) ||
                (a.mobile && a.mobile.includes(query))
            )
        );
        
        const container = document.getElementById('accountsList');
        container.innerHTML = results.length > 0 ? 
            results.map(a => this.renderAccountCard(a)).join('') :
            '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">No results found</div></div>';
    },
    
    renderAccountCard(account) {
        const riskClass = account.riskLevel ? account.riskLevel.toLowerCase() + '-risk' : '';
        const badge = account.riskLevel ? 
            `<span class="account-badge ${account.riskLevel.toLowerCase()}">${account.riskLevel}</span>` : '';
        
        const overdueAmt = account.loanType === 'TL' ? account.arrear : account.interestDue;
        
        return `
            <div class="account-item ${riskClass}" onclick="app.showAccountDetail('${account.accountNumber}')">
                <div class="account-header">
                    <div>
                        <div class="account-name">${account.customerName}</div>
                        <div class="account-number">${account.accountNumber}</div>
                    </div>
                    ${badge}
                </div>
                <div class="account-details">
                    <div><strong>Product</strong> ${account.product || 'N/A'}</div>
                    <div><strong>Outstanding</strong> ${this.formatCurrency(account.outstanding || 0)}</div>
                    <div><strong>IRAC</strong> ${account.irac || 'N/A'}</div>
                    <div><strong>Overdue</strong> ${this.formatCurrency(overdueAmt || 0)}</div>
                </div>
                <div class="account-actions">
                    <button class="btn-small btn-call" onclick="event.stopPropagation();app.callCustomer('${account.mobile}','${account.accountNumber}')">📞 Call</button>
                    <button class="btn-small btn-notice" onclick="event.stopPropagation();app.showAccountDetail('${account.accountNumber}');setTimeout(()=>app.showNoticeModal(),100)">📄 Notice</button>
                    <button class="btn-small btn-remark" onclick="event.stopPropagation();app.showAccountDetail('${account.accountNumber}');setTimeout(()=>app.showRemarkModal(),100)">➕ Remark</button>
                </div>
            </div>
        `;
    },
    
    // Account Detail Modal
    async showAccountDetail(accountNumber) {
        this.currentAccount = this.accounts.find(a => a.accountNumber === accountNumber);
        if (!this.currentAccount) return;
        
        const a = this.currentAccount;
        document.getElementById('modalAccountName').textContent = a.customerName;
        document.getElementById('detailAccountNumber').textContent = a.accountNumber;
        document.getElementById('detailProduct').textContent = a.product || 'N/A';
        document.getElementById('detailMobile').textContent = a.mobile || 'Not available';
        document.getElementById('detailIRAC').textContent = `IRAC ${a.irac || 'N/A'}`;
        document.getElementById('detailOutstanding').textContent = this.formatCurrency(a.outstanding || 0);
        document.getElementById('detailArrear').textContent = this.formatCurrency((a.arrear || a.interestDue || 0));
        document.getElementById('detailEMI').textContent = a.emi ? this.formatCurrency(a.emi) : 'N/A';
        document.getElementById('detailRisk').textContent = a.riskLevel || 'N/A';
        document.getElementById('detailSB').textContent = a.linkedSBAccount || 'Not linked';
        document.getElementById('detailDepositBalance').textContent = this.formatCurrency(a.totalDepositBalance || 0);
        document.getElementById('detailRecoverable').textContent = a.recoverable ? '✅ Yes' : '❌ No';
        
        await this.loadTimeline(accountNumber);
        this.showModal('accountModal');
    },
    
    async loadTimeline(accountNumber) {
        const entries = await db.timeline.where('accountNumber').equals(accountNumber).reverse().toArray();
        const container = document.getElementById('accountTimeline');
        
        if (entries.length === 0) {
            container.innerHTML = '<div class="empty-state-text">No activity yet</div>';
        } else {
            container.innerHTML = entries.map(e => `
                <div class="timeline-item">
                    <div class="timeline-date">${new Date(e.timestamp).toLocaleString()}</div>
                    <div class="timeline-user">${e.userName}</div>
                    <div class="timeline-content">
                        <span class="timeline-action">${e.actionType}</span>
                        ${e.remark || ''}
                    </div>
                </div>
            `).join('');
        }
    },
    
    // Utility Functions
    formatCurrency(amount) {
        if (!amount || amount === 0) return '₹0';
        const abs = Math.abs(amount);
        if (abs >= 10000000) return '₹' + (amount / 10000000).toFixed(2) + ' Cr';
        if (abs >= 100000) return '₹' + (amount / 100000).toFixed(2) + ' L';
        if (abs >= 1000) return '₹' + (amount / 1000).toFixed(2) + ' K';
        return '₹' + amount.toFixed(2);
    },
    
    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    },
    
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    },
    
    async loadSettings() {
        const contact = await db.settings.get('branchContact');
        const stored = contact ? contact.value : localStorage.getItem('branchContact');
        if (stored) {
            this.branchContact = stored;
            document.getElementById('branchContact').value = stored;
        }
    },
    
    async saveSettings() {
        const contact = document.getElementById('branchContact').value.trim();
        this.branchContact = contact || '9234567890';
        await db.settings.put({key: 'branchContact', value: this.branchContact});
        localStorage.setItem('branchContact', this.branchContact);
        alert('Settings saved!');
    },
    
    showImportModal() {
        this.switchView('import');
    },

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(e => console.log('SW registration failed'));
        }
    },
    
    // FILE IMPORT
    async processImport() {
        const tlFile = document.getElementById('tlFile').files[0];
        const ccodFile = document.getElementById('ccodFile').files[0];
        const depositFile = document.getElementById('depositFile').files[0];
        
        if (!tlFile && !ccodFile) {
            alert('Please select at least TL or CC/OD file');
            return;
        }
        
        document.getElementById('importProgress').style.display = 'block';
        document.getElementById('progressBar').style.width = '0%';
        
        try {
            let allAccounts = [];
            
            // Parse TL file
            if (tlFile) {
                document.getElementById('progressText').textContent = 'Parsing TL file...';
                const tlAccounts = await this.parseTLFile(tlFile);
                allAccounts = allAccounts.concat(tlAccounts);
                document.getElementById('progressBar').style.width = '33%';
            }
            
            // Parse CCOD file
            if (ccodFile) {
                document.getElementById('progressText').textContent = 'Parsing CC/OD file...';
                const ccodAccounts = await this.parseCCODFile(ccodFile);
                allAccounts = allAccounts.concat(ccodAccounts);
                document.getElementById('progressBar').style.width = '66%';
            }
            
            // Parse deposits
            let depositsByCIF = {};
            if (depositFile) {
                document.getElementById('progressText').textContent = 'Parsing deposits...';
                depositsByCIF = await this.parseDepositsFile(depositFile);
            }
            
            // Merge & calculate
            document.getElementById('progressText').textContent = 'Processing data...';
            for (let acc of allAccounts) {
                acc.riskLevel = this.calculateRisk(acc);
                if (acc.cif && depositsByCIF[acc.cif]) {
                    acc.totalDepositBalance = depositsByCIF[acc.cif].total;
                    acc.linkedSBAccount = depositsByCIF[acc.cif].sbAccount || 'Linked';
                    acc.linkedSBBalance = depositsByCIF[acc.cif].sb;
                    const overdueAmt = acc.loanType === 'TL' ? acc.arrear : acc.interestDue;
                    acc.recoverable = overdueAmt > 0 && acc.totalDepositBalance >= overdueAmt * 0.5;
                }
                acc.status = 'Active';
                acc.lastUpdated = new Date().toISOString();
            }
            
            // Save to DB
            await db.accounts.bulkPut(allAccounts);
            
            document.getElementById('progressBar').style.width = '100%';
            document.getElementById('progressText').textContent = 'Import complete!';
            
            localStorage.setItem('lastImportDate', new Date().toLocaleDateString());
            
            const result = `
                <div class="alert alert-success">
                    <strong>✅ Import Successful!</strong><br>
                    Total Accounts: ${allAccounts.length}<br>
                    TL: ${allAccounts.filter(a => a.loanType === 'TL').length}<br>
                    CC/OD: ${allAccounts.filter(a => a.loanType === 'CCOD').length}<br>
                    High Risk: ${allAccounts.filter(a => a.riskLevel === 'HIGH').length}
                </div>
            `;
            document.getElementById('importResult').innerHTML = result;
            document.getElementById('importResult').style.display = 'block';
            
            await this.loadData();
            this.updateDashboard();
            
        } catch (error) {
            alert('Import failed: ' + error.message);
            console.error(error);
        }
    },

    extractAccountNumber(line, start, end) {
        const windowStart = Math.max(0, start - 1);
        const windowEnd = Math.min(line.length, end + 1);
        const candidateSegment = line.substring(windowStart, windowEnd);
        const candidates = candidateSegment.match(/\d[\d-]{8,}/g) || [];

        if (candidates.length > 0) {
            const best = candidates.sort((a, b) => {
                const aLen = a.replace(/\D/g, '').length;
                const bLen = b.replace(/\D/g, '').length;
                return bLen - aLen;
            })[0];
            return best.replace(/\D/g, '');
        }

        return line.substring(start, end).replace(/\D/g, '');
    },
    
    async parseTLFile(file) {
        const text = await file.text();
        const lines = text.split('\n');
        const accounts = [];
        
        for (let line of lines) {
            if (line.length < 100 || line.includes('REPORT ID') || line.includes('---')) continue;
            if (line.trim().startsWith('84') || line.trim().startsWith('22')) {
                const accountNumber = this.extractAccountNumber(line, 7, 20);
                if (accountNumber && accountNumber.length >= 10) {
                    accounts.push({
                        accountNumber: accountNumber,
                        loanType: 'TL',
                        product: line.substring(21, 49).trim(),
                        customerName: line.substring(50, 85).trim(),
                        sanctionAmount: parseFloat(line.substring(86, 99).replace(/,/g, '')) || 0,
                        outstanding: parseFloat(line.substring(122, 140).replace(/,/g, '')) || 0,
                        arrear: parseFloat(line.substring(141, 156).replace(/,/g, '')) || 0,
                        irac: parseInt(line.substring(190, 194).trim()) || 1
                    });
                }
            }
        }
        return accounts;
    },
    
    async parseCCODFile(file) {
        const text = await file.text();
        const lines = text.split('\n');
        const accounts = [];
        
        for (let line of lines) {
            if (line.length < 100 || line.includes('REPORT ID') || line.includes('---')) continue;
            if (line.trim().startsWith('84') || line.trim().startsWith('22')) {
                const accountNumber = this.extractAccountNumber(line, 9, 22);
                if (accountNumber && accountNumber.length >= 10) {
                    const outStr = line.substring(150, 170).replace(/,/g, '').replace(/-/g, '').trim();
                    accounts.push({
                        accountNumber: accountNumber,
                        loanType: 'CCOD',
                        product: line.substring(23, 53).trim(),
                        customerName: line.substring(54, 84).trim(),
                        limit: parseFloat(line.substring(100, 120).replace(/,/g, '')) || 0,
                        outstanding: parseFloat(outStr) || 0,
                        irac: parseInt(line.substring(200, 204).trim()) || 0,
                        mobile: line.substring(350, 365).trim()
                    });
                }
            }
        }
        return accounts;
    },
    
    async parseDepositsFile(file) {
        const text = await file.text();
        const lines = text.split('\n');
        const depositsByCIF = {};
        
        for (let line of lines) {
            if (line.length < 100 || line.includes('REPORT ID')) continue;
            if (line.trim().startsWith('22') || line.trim().startsWith('84')) {
                const cif = line.substring(150, 167).trim().replace(/-/g, '');
                const balance = parseFloat(line.substring(60, 82).replace(/,/g, '')) || 0;
                const accType = line.substring(23, 28).trim();
                
                if (cif && balance > 0) {
                    if (!depositsByCIF[cif]) depositsByCIF[cif] = {total: 0, sb: 0, sbAccount: ''};
                    depositsByCIF[cif].total += balance;
                    if (accType.includes('SB')) {
                        depositsByCIF[cif].sb += balance;
                        const sbAccNum = this.extractAccountNumber(line, 7, 22);
                        if (sbAccNum) depositsByCIF[cif].sbAccount = sbAccNum;
                    }
                }
            }
        }
        return depositsByCIF;
    },
    
    calculateRisk(account) {
        if (account.loanType === 'TL') {
            if (account.irac >= 4) return 'HIGH';
            if (account.irac === 3) return 'HIGH';
            if (account.irac === 2) return 'MEDIUM';
            if (account.arrear > (account.emi || 0) * 2) return 'HIGH';
            if (account.arrear > (account.emi || 0)) return 'MEDIUM';
        } else {
            if (account.irac >= 2) return 'HIGH';
            if (account.interestDue > 0) return 'MEDIUM';
        }
        return 'LOW';
    },
    
    // COMMUNICATION
    async callCustomer(mobile, accountNumber = null) {
        if (!mobile || mobile === 'Not available') {
            alert('Mobile number not available');
            return;
        }

        const accountId = accountNumber || (this.currentAccount && this.currentAccount.accountNumber);
        if (accountId && this.currentUser) {
            await db.timeline.add({
                accountNumber: accountId,
                timestamp: new Date().toISOString(),
                userName: this.currentUser.name,
                actionType: 'Call',
                remark: `Called on ${mobile}`
            });
        }

        window.location.href = `tel:+91${mobile}`;
    },

    getRecommendedTemplate(account) {
        if (!account) return 'friendly';
        if (account.recoverable) return 'deposit';
        if (account.loanType === 'CCOD') return 'ccod';
        if (account.irac >= 3) return 'urgent';
        if (account.irac === 2) return 'overdue';
        return 'friendly';
    },
    
    showNoticeModal() {
        const templateSelect = document.getElementById('noticeTemplate');
        if (this.currentAccount && templateSelect) {
            templateSelect.value = this.getRecommendedTemplate(this.currentAccount);
        }
        this.updateNoticePreview();
        this.showModal('noticeModal');
    },
    
    updateNoticePreview() {
        const template = document.getElementById('noticeTemplate').value;
        const a = this.currentAccount;
        const branchContact = this.branchContact || localStorage.getItem('branchContact') || '9234567890';
        
        let text = '';
        if (template === 'friendly') {
            text = `Dear ${a.customerName},\n\nYour loan EMI of ₹${a.emi || 'N/A'} is due soon.\n\nLoan A/c: ${a.accountNumber}\n\nPlease pay on time to maintain good account status.\n\nJRGB Ramgarh Cantt | ${branchContact}`;
        } else if (template === 'overdue') {
            text = `Dear ${a.customerName},\n\nPAYMENT REMINDER\n\nLoan A/c: ${a.accountNumber}\nOverdue: ₹${a.arrear || a.interestDue || 0}\n\nPlease clear dues to avoid late charges.\n\nJRGB Ramgarh Cantt | ${branchContact}`;
        } else if (template === 'urgent') {
            text = `URGENT: Payment Required\n\nDear ${a.customerName},\n\nLoan A/c: ${a.accountNumber}\nOverdue Amount: ₹${a.arrear || a.interestDue || 0}\n\nYour account is at risk of NPA classification.\nThis will impact your CIBIL score.\n\nPay immediately or visit branch.\n\nJRGB Ramgarh Cantt | ${branchContact}`;
        } else if (template === 'ccod') {
            text = `Dear ${a.customerName},\n\nYour CC/OD account needs attention:\n\nAccount: ${a.accountNumber}\nInterest Due: ₹${a.interestDue || 0}\n\nPlease credit interest and ensure regular turnover.\n\nJRGB Ramgarh Cantt | ${branchContact}`;
        } else if (template === 'deposit') {
            text = `Dear ${a.customerName},\n\nLoan A/c: ${a.accountNumber}\nOverdue: ₹${a.arrear || a.interestDue || 0}\n\nWe notice deposit balance in your account.\n\nRequest to clear loan dues or visit branch.\n\nJRGB Ramgarh Cantt | ${branchContact}`;
        }
        
        document.getElementById('noticeText').value = text;
    },
    
    copyNotice() {
        const text = document.getElementById('noticeText').value;
        navigator.clipboard.writeText(text).then(() => {
            alert('✅ Notice copied to clipboard!');
            if (document.getElementById('logNotice').checked) {
                this.logNoticeInTimeline();
            }
        });
    },
    
    sendWhatsApp() {
        const text = document.getElementById('noticeText').value;
        const mobile = this.currentAccount.mobile;
        if (!mobile) {
            alert('Mobile number not available');
            return;
        }
        const url = `https://wa.me/91${mobile}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
        if (document.getElementById('logNotice').checked) {
            this.logNoticeInTimeline();
        }
    },
    
    async logNoticeInTimeline() {
        await db.timeline.add({
            accountNumber: this.currentAccount.accountNumber,
            timestamp: new Date().toISOString(),
            userName: this.currentUser.name,
            actionType: 'Notice Sent',
            remark: 'Notice generated and sent'
        });
    },
    
    showRemarkModal() {
        document.getElementById('nextFollowup').value = new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0];
        this.showModal('remarkModal');
    },
    
    async saveRemark() {
        const type = document.getElementById('remarkType').value;
        const text = document.getElementById('remarkText').value;
        const nextFollowup = document.getElementById('nextFollowup').value;
        
        if (!text) {
            alert('Please enter remark');
            return;
        }
        
        await db.timeline.add({
            accountNumber: this.currentAccount.accountNumber,
            timestamp: new Date().toISOString(),
            userName: this.currentUser.name,
            actionType: type,
            remark: text
        });
        
        await db.accounts.update(this.currentAccount.accountNumber, {
            nextFollowup: nextFollowup,
            lastFollowupDate: new Date().toISOString()
        });
        
        this.closeModal('remarkModal');
        alert('✅ Remark saved!');
        await this.loadTimeline(this.currentAccount.accountNumber);
        document.getElementById('remarkText').value = '';
    },
    
    // DATA EXPORT/IMPORT
    async exportData() {
        const data = {
            accounts: await db.accounts.toArray(),
            timeline: await db.timeline.toArray(),
            exportDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `loan-portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    },
    
    async importBackup() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                if (!data.accounts || !Array.isArray(data.accounts)) {
                    alert('Invalid backup file: missing accounts data');
                    return;
                }
                if (!confirm(`Restore ${data.accounts.length} accounts and ${(data.timeline || []).length} timeline entries?\nThis will overwrite existing data.`)) {
                    return;
                }
                await db.accounts.clear();
                await db.timeline.clear();
                await db.accounts.bulkPut(data.accounts);
                if (data.timeline && data.timeline.length > 0) {
                    await db.timeline.bulkPut(data.timeline);
                }
                await this.loadData();
                this.updateDashboard();
                alert('Backup restored successfully!');
            } catch (error) {
                alert('Restore failed: ' + error.message);
                console.error(error);
            }
        };
        input.click();
    },

    async clearAllData() {
        if (confirm('⚠️ This will delete ALL data! Are you sure?')) {
            if (confirm('Final confirmation - this cannot be undone!')) {
                await db.accounts.clear();
                await db.timeline.clear();
                await db.deposits.clear();
                alert('All data cleared');
                window.location.reload();
            }
        }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => app.init());
