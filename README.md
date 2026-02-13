# 🏦 Loan Portfolio Manager - Branch 443

**Complete Loan Portfolio Management PWA for JRGB Ramgarh Cantt**

## ✨ Features

### 📊 **Dashboard**
- Portfolio overview (Total accounts, Outstanding, Arrear)
- Asset quality metrics (SMA-0/1/2, NPA)
- Recovery intelligence (Recoverable from deposits)
- Today's followups

### 📋 **Account Management**
- Complete account list with filters
- High-risk, SMA-2, NPA, Recoverable filters
- Search by account/customer/mobile
- Account detail view with timeline

### 📥 **Smart Import**
- Import CBS reports (TL Balance, CC/OD Balance, Deposits)
- Automatic data merging and enrichment
- Risk calculation
- Deposit-loan linking

### 💬 **Communication**
- 5 notice templates (Friendly, Overdue, Urgent, CC/OD, Deposit Recovery)
- Copy to clipboard
- WhatsApp integration
- Timeline logging

### 📝 **Timeline Tracking**
- Call logs, visits, remarks, promises
- User and timestamp tracking
- Activity history per account

### 💾 **Data Management**
- Offline-first (works without internet)
- Backup & restore (JSON export)
- IndexedDB storage

---

## 🚀 Quick Start

### **Option 1: Open Directly (Easiest)**
1. Copy all files to a folder on your phone/computer
2. Open `index.html` in Chrome/Edge browser
3. Login with PIN: **1234** (default for all users)
4. Start using!

### **Option 2: GitHub Pages (Best for Mobile)**
1. Create GitHub account
2. Create new repository: `loan-portfolio`
3. Upload all files
4. Go to Settings → Pages → Enable GitHub Pages
5. Access via: `https://yourusername.github.io/loan-portfolio/`
6. On mobile: Open in Chrome → Menu → "Install App"

### **Option 3: Local Server**
```bash
# If you have Python installed
python -m http.server 8000
# Open: http://localhost:8000
```

---

## 📱 Installation on Mobile

1. Open the app in Chrome browser
2. Tap menu (⋮) → "Install app" or "Add to Home Screen"
3. App icon will appear on home screen
4. Works offline after first load!

---

## 📥 How to Import Data

### **Step 1: Get CBS Reports**
From your CBS system, generate these reports:
- `LOAN_BALANCE_FILE.txt` (Term Loans)
- `CC_OD_BALANCE_FILE.txt` (CC/OD accounts)
- `DEPOSITS_BALANCE_FILE.txt` (All deposits)

### **Step 2: Import in App**
1. Open app → Go to **Import** tab
2. Select files:
   - TL file → Choose `LOAN_BALANCE_FILE.txt`
   - CC/OD file → Choose `CC_OD_BALANCE_FILE.txt`
   - Deposits file → Choose `DEPOSITS_BALANCE_FILE.txt`
3. Click **Process Import**
4. Wait for processing (30-60 seconds)
5. See import summary
6. Go to Dashboard to view data!

### **What Happens During Import?**
- Parses all account data
- Calculates risk levels (HIGH/MEDIUM/LOW)
- Links deposits by CIF
- Identifies recoverable accounts
- Stores in local database

---

## 🎯 Daily Workflow

### **Morning Routine**
1. Open app → Check **Dashboard**
2. View "Today's Followups"
3. Click account → Call customer
4. Log outcome in remarks
5. Set next followup date

### **Account Follow-up**
1. Go to **Accounts** tab
2. Apply filter (High Risk / SMA-2 / Recoverable)
3. Click account to view details
4. Actions:
   - 📞 **Call** → Opens dialer
   - 📄 **Notice** → Generate and send
   - ➕ **Remark** → Add followup note

### **Generate Notice**
1. Open account detail
2. Click "Generate Notice"
3. Select template (auto-fills based on IRAC)
4. Edit text if needed
5. **Copy to Clipboard** or **Open WhatsApp**
6. ✅ Check "Log in timeline" to track

### **Monthly Data Refresh**
1. Generate fresh CBS reports
2. Go to Import tab
3. Upload new files
4. Process import
5. Data automatically updates!

---

## 🔒 Security & Data

### **User Management**
- Default PIN: **1234** (for all users)
- 4 user roles: BM, DBM, Assistant, Attendant
- All actions logged with username

### **Data Storage**
- Everything stored locally in browser (IndexedDB)
- No data sent to any server
- Works completely offline
- Data persists across sessions

### **Backup & Restore**
**Backup:**
1. Settings tab → "Export Backup"
2. Saves JSON file with all data
3. Store securely

**Restore:**
1. Settings tab → "Restore from Backup"
2. Select backup JSON file
3. All data restored

---

## 📊 Understanding Dashboard Metrics

| Metric | Meaning |
|--------|---------|
| **Total Accounts** | Active loan accounts (TL + CC/OD) |
| **Total Outstanding** | Sum of all loan balances |
| **Total Arrear** | Overdue amount in TL accounts |
| **High Risk** | Accounts needing immediate attention |
| **SMA-0** | Standard assets (IRAC 1) |
| **SMA-1** | 30-60 days overdue (IRAC 2) |
| **SMA-2** | 60-90 days overdue (IRAC 3) |
| **NPA** | Non-performing assets (IRAC 4+) |
| **Recoverable** | Accounts with sufficient deposit balance |

---

## 🎨 Notice Templates

### **1. Friendly Reminder** (IRAC 1, <30 days)
Use for: Regular payment reminders
Tone: Polite and professional

### **2. Overdue Alert** (IRAC 2, 30-60 days)
Use for: First overdue stage
Tone: Firm but respectful

### **3. Urgent Notice** (IRAC 3, 60-90 days)
Use for: Serious overdue
Tone: Urgent, mentions CIBIL impact

### **4. CC/OD Interest Due**
Use for: CC/OD accounts with pending interest
Tone: Professional reminder

### **5. Deposit Recovery Notice**
Use for: Accounts with sufficient deposits
Tone: Suggests using deposit to clear dues

---

## 🔧 Troubleshooting

**Q: Import not working?**
- Ensure files are actual CBS reports (not Excel conversions)
- File should be .txt or .csv format
- Check browser console for errors

**Q: Data not showing?**
- Refresh page (swipe down)
- Check if import completed successfully
- Verify files were correct format

**Q: Can't install on phone?**
- Use Chrome browser (not Safari or Firefox)
- Open app URL in Chrome
- Look for "Install" prompt or "Add to Home Screen"

**Q: App not working offline?**
- Must open app once while online
- Service worker needs to install first
- After first load, works completely offline

**Q: Lost data?**
- Check if you have backup JSON file
- Use "Restore from Backup" in Settings
- Otherwise, re-import CBS reports

---

## 📁 File Structure

```
loan-portfolio-pwa/
├── index.html          # Main app interface
├── styles.css          # All styling (compressed)
├── app.js              # Complete app logic
├── manifest.json       # PWA configuration
├── sw.js               # Service worker (offline)
└── README.md           # This file
```

---

## 🎯 Tips for Best Results

1. **Import monthly** to keep data fresh
2. **Set followup dates** consistently
3. **Use filters** to prioritize work
4. **Backup weekly** to avoid data loss
5. **Check "Today's Followups"** every morning
6. **Target recoverable accounts** first - easy wins!

---

## 📞 Default Settings

- **Branch:** RAMGARH CANTT
- **Branch Code:** 443
- **Default PIN:** 1234
- **Recoverable Threshold:** 50% of overdue amount

Change branch contact in Settings tab.

---

## 🚀 Advanced Usage

### **Deposit-Loan Recovery Strategy**
1. Dashboard → Check "Recoverable from Deposits"
2. Accounts tab → Filter: "Recoverable"
3. See accounts with sufficient deposit balance
4. Generate "Deposit Recovery Notice"
5. Call customer with specific amount
6. Track conversation in timeline

### **Risk-Based Prioritization**
1. Dashboard → Note high-risk count
2. Accounts tab → Filter: "High Risk"
3. Sort by overdue amount (highest first)
4. Work through top 10 accounts daily
5. Move to medium risk after clearing high

### **Staff Assignment** (Coming Soon)
- Assign accounts to team members
- Track individual performance
- Generate staff-wise reports

---

## 📈 Coming Soon

- [ ] Advanced analytics & charts
- [ ] Predictive NPA alerts
- [ ] SMS integration
- [ ] Cloud backup option
- [ ] Desktop notifications
- [ ] Multi-branch support

---

## 💡 Support

For issues or questions:
1. Check Troubleshooting section
2. Review import file format
3. Test with sample data first

---

## 📄 License

For internal use only - JRGB Branch 443

---

**Built with ❤️ for efficient loan portfolio management**

*Version 1.0 - February 2026*
