// ══════════════════════════════════════════════
//  CURRENCY SYSTEM
// ══════════════════════════════════════════════
const CURRENCIES = [
  {code:"INR",symbol:"₹",locale:"en-IN",name:"Indian Rupee",flag:"🇮🇳"},
  {code:"USD",symbol:"$",locale:"en-US",name:"US Dollar",flag:"🇺🇸"},
  {code:"EUR",symbol:"€",locale:"de-DE",name:"Euro",flag:"🇪🇺"},
  {code:"GBP",symbol:"£",locale:"en-GB",name:"British Pound",flag:"🇬🇧"},
  {code:"JPY",symbol:"¥",locale:"ja-JP",name:"Japanese Yen",flag:"🇯🇵"},
  {code:"CNY",symbol:"¥",locale:"zh-CN",name:"Chinese Yuan",flag:"🇨🇳"},
  {code:"AUD",symbol:"A$",locale:"en-AU",name:"Australian Dollar",flag:"🇦🇺"},
  {code:"CAD",symbol:"C$",locale:"en-CA",name:"Canadian Dollar",flag:"🇨🇦"},
  {code:"CHF",symbol:"Fr",locale:"de-CH",name:"Swiss Franc",flag:"🇨🇭"},
  {code:"SGD",symbol:"S$",locale:"en-SG",name:"Singapore Dollar",flag:"🇸🇬"},
  {code:"AED",symbol:"د.إ",locale:"ar-AE",name:"UAE Dirham",flag:"🇦🇪"},
  {code:"SAR",symbol:"﷼",locale:"ar-SA",name:"Saudi Riyal",flag:"🇸🇦"},
  {code:"MYR",symbol:"RM",locale:"ms-MY",name:"Malaysian Ringgit",flag:"🇲🇾"},
  {code:"IDR",symbol:"Rp",locale:"id-ID",name:"Indonesian Rupiah",flag:"🇮🇩"},
  {code:"THB",symbol:"฿",locale:"th-TH",name:"Thai Baht",flag:"🇹🇭"},
  {code:"PHP",symbol:"₱",locale:"en-PH",name:"Philippine Peso",flag:"🇵🇭"},
  {code:"KRW",symbol:"₩",locale:"ko-KR",name:"South Korean Won",flag:"🇰🇷"},
  {code:"BRL",symbol:"R$",locale:"pt-BR",name:"Brazilian Real",flag:"🇧🇷"},
  {code:"MXN",symbol:"$",locale:"es-MX",name:"Mexican Peso",flag:"🇲🇽"},
  {code:"ZAR",symbol:"R",locale:"en-ZA",name:"South African Rand",flag:"🇿🇦"},
  {code:"NGN",symbol:"₦",locale:"en-NG",name:"Nigerian Naira",flag:"🇳🇬"},
  {code:"EGP",symbol:"£",locale:"ar-EG",name:"Egyptian Pound",flag:"🇪🇬"},
  {code:"PKR",symbol:"₨",locale:"ur-PK",name:"Pakistani Rupee",flag:"🇵🇰"},
  {code:"BDT",symbol:"৳",locale:"bn-BD",name:"Bangladeshi Taka",flag:"🇧🇩"},
  {code:"NPR",symbol:"Rs",locale:"ne-NP",name:"Nepali Rupee",flag:"🇳🇵"},
  {code:"LKR",symbol:"Rs",locale:"si-LK",name:"Sri Lankan Rupee",flag:"🇱🇰"},
  {code:"SEK",symbol:"kr",locale:"sv-SE",name:"Swedish Krona",flag:"🇸🇪"},
  {code:"NOK",symbol:"kr",locale:"nb-NO",name:"Norwegian Krone",flag:"🇳🇴"},
  {code:"DKK",symbol:"kr",locale:"da-DK",name:"Danish Krone",flag:"🇩🇰"},
  {code:"NZD",symbol:"NZ$",locale:"en-NZ",name:"New Zealand Dollar",flag:"🇳🇿"},
];

let activeCurrencyCode = localStorage.getItem("ft_currency") || "INR";
function getCurrency(){ return CURRENCIES.find(c=>c.code===activeCurrencyCode)||CURRENCIES[0]; }

function fmt(n){
  const c=getCurrency();
  try{ return new Intl.NumberFormat(c.locale,{style:"currency",currency:c.code,maximumFractionDigits:0}).format(n); }
  catch{ return `${c.symbol}${Math.round(n).toLocaleString()}`; }
}

// ══════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════
let transactions = JSON.parse(localStorage.getItem("ft_transactions")) || [];
let budgets      = JSON.parse(localStorage.getItem("ft_budgets"))      || {};
let goals        = JSON.parse(localStorage.getItem("ft_goals"))        || [];
let bills        = JSON.parse(localStorage.getItem("ft_bills"))        || [];
let darkMode     = localStorage.getItem("ft_dark") === "true";
let currentChartType = "doughnut";
let rLineChart, rDonutChart, rBarChart;

const icons = {
  "Food & Dining":"🍔","Transport":"🚗","Shopping":"🛍️","Entertainment":"🎬",
  "Health":"💊","Bills & Utilities":"⚡","Education":"📚","Salary":"💼",
  "Freelance":"💻","Investment":"📈","Other":"📦"
};
const getIcon = cat => icons[cat] || "💰";
const COLORS = ["#6366f1","#10b981","#f43f5e","#f59e0b","#06b6d4","#8b5cf6","#ec4899","#14b8a6","#84cc16","#fb923c"];

// ── Elements ──
const balanceEl    = document.getElementById("balance");
const incomeEl     = document.getElementById("income");
const expenseEl    = document.getElementById("expense");
const savingsEl    = document.getElementById("savingsRate");
const listEl       = document.getElementById("transactionList");
const form         = document.getElementById("transactionForm");
const themeToggle  = document.getElementById("themeToggle");
const searchInput  = document.getElementById("searchInput");
const monthFilter  = document.getElementById("monthFilter");
const balanceBar   = document.getElementById("balanceBar");
const budgetListEl = document.getElementById("budgetList");
const emptyState   = document.getElementById("emptyState");
const noChartData  = document.getElementById("noChartData");
const toastEl      = document.getElementById("toast");
const brandIcon    = document.getElementById("brandIcon");
const amountPrefix = document.getElementById("amountPrefix");
const ctx          = document.getElementById("expenseChart").getContext("2d");
let chart;

// ── Theme init ──
if(darkMode){ document.body.classList.add("dark"); themeToggle.textContent="☀️"; }

// ══════════════════════════════════════════════
//  RECURRING — check on load
// ══════════════════════════════════════════════
function processRecurring(){
  const todayStr = today();
  let added = 0;
  const templates = transactions.filter(t => t.recurring && t.recurring !== "none");

  templates.forEach(t => {
    const lastDate = new Date(t.date + "T00:00:00");
    const now      = new Date(todayStr + "T00:00:00");
    let nextDate   = new Date(lastDate);

    if(t.recurring === "daily")   nextDate.setDate(nextDate.getDate() + 1);
    if(t.recurring === "weekly")  nextDate.setDate(nextDate.getDate() + 7);
    if(t.recurring === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);

    if(nextDate <= now){
      const newTx = { ...t, id: Date.now() + Math.random(), date: nextDate.toISOString().split("T")[0] };
      transactions.unshift(newTx);
      t.date = newTx.date;
      added++;
    }
  });

  if(added > 0){ save(); showToast(`${added} recurring transaction${added>1?"s":""} auto-added ✓`); }
}

// ══════════════════════════════════════════════
//  ADD TRANSACTION
// ══════════════════════════════════════════════
form.addEventListener("submit", e => {
  e.preventDefault();
  const text      = document.getElementById("text").value.trim();
  const amount    = parseFloat(document.getElementById("amount").value);
  const category  = document.getElementById("category").value || "Other";
  const note      = document.getElementById("note").value.trim();
  const dateVal   = document.getElementById("date").value;
  const recurring = document.getElementById("recurring").value;
  if(!text || isNaN(amount)) return;

  transactions.unshift({
    id: Date.now(), text, amount, category, note,
    date: dateVal || today(),
    recurring: recurring || null
  });
  save(); render(); form.reset();
  document.getElementById("date").value = today();
  showToast(`${amount>0?"Income":"Expense"} added ✓`);
  checkMilestone();
});

function deleteTransaction(id){
  transactions = transactions.filter(t => t.id !== id);
  save(); render();
  showToast("Transaction deleted");
}

document.getElementById("clearBtn").addEventListener("click", () => {
  if(!transactions.length) return showToast("Nothing to clear");
  if(!confirm("Delete all transactions?")) return;
  transactions=[]; save(); render();
  showToast("All cleared");
});

// ══════════════════════════════════════════════
//  BUDGET
// ══════════════════════════════════════════════
function setBudget(){
  const cat = document.getElementById("budgetCategory").value;
  const amt = parseFloat(document.getElementById("budgetAmount").value);
  if(!cat||isNaN(amt)||amt<=0) return showToast("Pick a category & valid amount");
  budgets[cat]=amt; saveBudgets(); render();
  document.getElementById("budgetCategory").value="";
  document.getElementById("budgetAmount").value="";
  showToast(`Budget set: ${cat} → ${fmt(amt)}`);
}
function removeBudget(cat){ delete budgets[cat]; saveBudgets(); render(); showToast(`Budget removed: ${cat}`); }

// ══════════════════════════════════════════════
//  SAVINGS GOALS
// ══════════════════════════════════════════════
function addGoal(){
  const name   = document.getElementById("goalName").value.trim();
  const target = parseFloat(document.getElementById("goalTarget").value);
  const emoji  = document.getElementById("goalEmoji").value.trim() || "🎯";
  if(!name||isNaN(target)||target<=0) return showToast("Enter goal name & target");
  goals.push({ id:Date.now(), name, target, saved:0, emoji });
  saveGoals(); renderGoals();
  document.getElementById("goalName").value="";
  document.getElementById("goalTarget").value="";
  document.getElementById("goalEmoji").value="";
  showToast(`Goal added: ${name} 🎯`);
}

function addToGoal(id){
  const amt = parseFloat(prompt("How much to add to this goal?"));
  if(isNaN(amt)||amt<=0) return;
  const g = goals.find(g=>g.id===id);
  if(!g) return;
  g.saved = Math.min(g.target, g.saved + amt);
  saveGoals(); renderGoals();
  if(g.saved >= g.target){ showToast(`🎉 Goal "${g.name}" completed!`); fireConfetti(); }
  else showToast(`Added ${fmt(amt)} to "${g.name}"`);
}

function removeGoal(id){
  goals = goals.filter(g=>g.id!==id);
  saveGoals(); renderGoals();
  showToast("Goal removed");
}

function renderGoals(){
  const strip = document.getElementById("goalsStrip");
  const list  = document.getElementById("goalsList");
  if(!goals.length){ strip.style.display="none"; list.innerHTML=""; return; }
  strip.style.display="flex";

  strip.innerHTML = goals.map(g => {
    const pct = Math.min(100,(g.saved/g.target)*100).toFixed(0);
    return `
      <div class="goal-card">
        <div class="goal-emoji">${g.emoji}</div>
        <div class="goal-name">${g.name}</div>
        <div class="goal-amounts">${fmt(g.saved)} / ${fmt(g.target)}</div>
        <div class="goal-progress-wrap">
          <div class="goal-progress-bar" style="width:${pct}%;background:${pct>=100?"var(--income)":"var(--primary)"}"></div>
        </div>
        <div class="goal-pct">${pct}% saved</div>
        <div class="goal-actions">
          <button onclick="addToGoal(${g.id})" class="btn-secondary sm" style="flex:1">+ Add</button>
          <button onclick="removeGoal(${g.id})" class="btn-danger sm">✕</button>
        </div>
      </div>`;
  }).join("");

  list.innerHTML = goals.map(g => {
    const pct = Math.min(100,(g.saved/g.target)*100).toFixed(0);
    return `
      <div class="budget-item ok" style="flex-direction:column;align-items:flex-start">
        <div style="display:flex;justify-content:space-between;width:100%;align-items:center">
          <span style="font-weight:600">${g.emoji} ${g.name}</span>
          <button class="budget-remove" onclick="removeGoal(${g.id})">✕</button>
        </div>
        <div class="budget-bar-wrap" style="width:100%;margin-top:6px">
          <div class="budget-bar" style="width:${pct}%;background:var(--income)"></div>
        </div>
        <div style="font-size:.72rem;margin-top:3px">${fmt(g.saved)} / ${fmt(g.target)} · ${pct}%</div>
      </div>`;
  }).join("");
}

// ══════════════════════════════════════════════
//  BILL REMINDERS
// ══════════════════════════════════════════════
document.getElementById("billsBtn").addEventListener("click", openBillsModal);

function openBillsModal(){
  document.getElementById("billsModal").style.display="flex";
  document.body.style.overflow="hidden";
  renderBills();
  // pre-fill today as default due date
  const dd = document.getElementById("billDueDate");
  if(!dd.value) dd.value = today();
}

function closeBillsModal(){
  document.getElementById("billsModal").style.display="none";
  document.body.style.overflow="";
}

function billsOverlayClose(e){
  if(e.target===document.getElementById("billsModal")) closeBillsModal();
}

function getDaysUntil(dateStr){
  const t = new Date(); t.setHours(0,0,0,0);
  const d = new Date(dateStr + "T00:00:00");
  return Math.round((d - t) / (1000*60*60*24));
}

function addBill(){
  const name    = document.getElementById("billName").value.trim();
  const amount  = parseFloat(document.getElementById("billAmount").value);
  const dueDate = document.getElementById("billDueDate").value;
  const repeat  = document.getElementById("billRepeat").value;
  if(!name||isNaN(amount)||amount<=0||!dueDate) return showToast("Fill in all bill details");

  bills.push({ id:Date.now(), name, amount, dueDate, repeat });
  saveBills(); renderBills(); renderDueSoon();
  document.getElementById("billName").value="";
  document.getElementById("billAmount").value="";
  showToast(`Bill added: ${name} 🔔`);
}

function removeBill(id){
  bills = bills.filter(b=>b.id!==id);
  saveBills(); renderBills(); renderDueSoon();
  showToast("Bill removed");
}

function renderDueSoon(){
  const strip = document.getElementById("dueSoonStrip");
  if(!strip) return;

  const tagged = bills.map(b=>({...b, days:getDaysUntil(b.dueDate)}))
    .filter(b=>b.days<=14)
    .sort((a,b)=>a.days-b.days);

  if(!tagged.length){ strip.style.display="none"; return; }
  strip.style.display="block";

  strip.innerHTML=`
    <div class="due-soon-wrap">
      <div class="due-soon-header">
        <span class="due-soon-title">🔔 Bills Due Soon</span>
        <button onclick="openBillsModal()" class="btn-secondary sm">Manage</button>
      </div>
      <div class="due-soon-list">
        ${tagged.map(b=>{
          const urgency = b.days<0?"overdue":b.days<=3?"urgent":b.days<=7?"soon":"ok";
          const label   = b.days<0?`${Math.abs(b.days)}d overdue`:b.days===0?"Due today!":b.days===1?"Tomorrow":`${b.days}d left`;
          return `<div class="due-soon-item">
            <div class="due-item-left">
              <span class="due-badge ${urgency}">${label}</span>
              <span class="due-item-name">${b.name}</span>
            </div>
            <span class="due-item-amount">${fmt(b.amount)}</span>
          </div>`;
        }).join("")}
      </div>
    </div>`;
}

function renderBills(){
  const list = document.getElementById("billsList");
  if(!list) return;

  if(!bills.length){
    list.innerHTML=`<div class="empty-state" style="padding:32px">No bills yet — add your first one above 🔔</div>`;
    return;
  }

  const sorted = bills.map(b=>({...b,days:getDaysUntil(b.dueDate)})).sort((a,b)=>a.days-b.days);

  list.innerHTML=sorted.map(b=>{
    const urgency = b.days<0?"overdue":b.days<=3?"urgent":b.days<=7?"soon":"ok";
    const label   = b.days<0?`${Math.abs(b.days)}d overdue`:b.days===0?"Due today!":b.days===1?"Tomorrow":`in ${b.days}d`;
    const repeatIcon = b.repeat==="once"?"📅":b.repeat==="monthly"?"🔁 Monthly":b.repeat==="quarterly"?"🔁 Quarterly":"🔁 Yearly";
    return `
      <div class="bill-item ${urgency}">
        <div class="bill-icon-wrap">
          <div class="bill-icon">📋</div>
        </div>
        <div class="bill-info">
          <div class="bill-name">${b.name}</div>
          <div class="bill-meta">${repeatIcon} · Due ${formatDate(b.dueDate)}</div>
        </div>
        <div class="bill-right">
          <div class="bill-amount">${fmt(b.amount)}</div>
          <span class="due-badge ${urgency}">${label}</span>
        </div>
        <button class="delete-btn" onclick="removeBill(${b.id})" title="Remove">✕</button>
      </div>`;
  }).join("");
}

// ══════════════════════════════════════════════
//  FINANCIAL HEALTH SCORE
// ══════════════════════════════════════════════
document.getElementById("healthBtn").addEventListener("click", openHealthModal);

function openHealthModal(){
  document.getElementById("healthModal").style.display="flex";
  document.body.style.overflow="hidden";
  buildHealthScore();
}

function closeHealthModal(){
  document.getElementById("healthModal").style.display="none";
  document.body.style.overflow="";
}

function healthOverlayClose(e){
  if(e.target===document.getElementById("healthModal")) closeHealthModal();
}

function calculateHealthScore(){
  const income  = transactions.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
  const expense = transactions.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
  const balance = income - expense;
  let score = 0;
  const breakdown = [];

  // 1. Savings Rate (0–35 pts) — 40%+ savings = full marks
  const savingsRate = income>0 ? (balance/income)*100 : 0;
  const savingsScore = Math.min(35, Math.max(0, savingsRate * 0.875));
  score += savingsScore;
  breakdown.push({
    label:"Savings Rate", score:Math.round(savingsScore), max:35,
    note: income>0 ? `${Math.max(0,savingsRate).toFixed(1)}% of income saved` : "Add income to track this",
    tip: savingsRate<20 ? "Try to save at least 20% of your income each month." : null
  });

  // 2. Budget Adherence (0–25 pts)
  const budgetEntries = Object.entries(budgets);
  if(budgetEntries.length>0){
    const catTotals={};
    transactions.filter(t=>t.amount<0).forEach(t=>{ catTotals[t.category]=(catTotals[t.category]||0)+Math.abs(t.amount); });
    const ok = budgetEntries.filter(([cat,limit])=>(catTotals[cat]||0)<=limit).length;
    const budgetScore = (ok/budgetEntries.length)*25;
    score += budgetScore;
    breakdown.push({
      label:"Budget Adherence", score:Math.round(budgetScore), max:25,
      note:`${ok} of ${budgetEntries.length} budget${budgetEntries.length>1?"s":""} on track`,
      tip: ok<budgetEntries.length ? "Review overspent categories and adjust your habits." : null
    });
  } else {
    score += 12;
    breakdown.push({
      label:"Budget Adherence", score:12, max:25,
      note:"Set budgets to improve this score",
      tip:"Create budget limits for your top spending categories."
    });
  }

  // 3. Tracking Consistency (0–25 pts) — active in 3 of last 3 months = full
  const activeMonths = new Set();
  const now = new Date();
  transactions.forEach(t=>{
    if(!t.date) return;
    const d = new Date(t.date+"T00:00:00");
    const diffMonths = (now.getFullYear()-d.getFullYear())*12 + (now.getMonth()-d.getMonth());
    if(diffMonths<=2) activeMonths.add(t.date.slice(0,7));
  });
  const consistencyScore = Math.min(25, activeMonths.size * 8.34);
  score += consistencyScore;
  breakdown.push({
    label:"Tracking Consistency", score:Math.round(consistencyScore), max:25,
    note:`Active in ${activeMonths.size} of last 3 months`,
    tip: activeMonths.size<3 ? "Log transactions regularly to build a clearer picture." : null
  });

  // 4. Expense Ratio (0–15 pts) — spending <50% of income = full
  const expRatio = income>0 ? expense/income : 1;
  const ratioScore = Math.min(15, Math.max(0,(1-expRatio)*15));
  score += ratioScore;
  breakdown.push({
    label:"Expense Ratio", score:Math.round(ratioScore), max:15,
    note: income>0 ? `Spending ${Math.min(100,(expRatio*100)).toFixed(0)}% of income` : "Add income transactions",
    tip: expRatio>0.8 ? "Your expenses are high relative to income. Look for areas to cut back." : null
  });

  return { score: Math.round(Math.min(100,score)), breakdown };
}

function buildHealthScore(){
  if(!transactions.length){
    document.getElementById("scoreBreakdown").innerHTML=`<div class="empty-state" style="padding:24px">Add some transactions first to calculate your score 💡</div>`;
    document.getElementById("scoreTips").innerHTML="";
    return;
  }

  const {score, breakdown} = calculateHealthScore();
  const CIRCUMFERENCE = 364.42; // 2π×58

  // Animate arc
  const arc = document.getElementById("scoreArc");
  const numEl = document.getElementById("scoreNumber");
  const labelEl = document.getElementById("scoreLabel");

  let gradId, color, labelText;
  if(score>=70){      gradId="scoreGradGreen";  color="#10b981"; labelText="Great Shape 🌟"; }
  else if(score>=40){ gradId="scoreGradYellow"; color="#f59e0b"; labelText="Room to Grow 📈"; }
  else {              gradId="scoreGradRed";    color="#f43f5e"; labelText="Needs Attention ⚠️"; }

  arc.setAttribute("stroke", `url(#${gradId})`);
  const offset = CIRCUMFERENCE * (1 - score/100);

  setTimeout(()=>{ arc.style.strokeDashoffset = offset; }, 80);

  // Animate number
  let current = 0;
  const step = score/60;
  const ticker = setInterval(()=>{
    current = Math.min(score, current+step);
    numEl.textContent = Math.round(current);
    if(current>=score) clearInterval(ticker);
  }, 16);

  labelEl.textContent = labelText;
  labelEl.style.color = color;

  // Breakdown bars
  document.getElementById("scoreBreakdown").innerHTML=`
    <div class="breakdown-grid">
      ${breakdown.map(b=>{
        const pct = (b.score/b.max)*100;
        const barColor = pct>=80?"var(--income)":pct>=50?"var(--warning)":"var(--expense)";
        return `
          <div class="breakdown-item">
            <div class="breakdown-header">
              <span class="breakdown-label">${b.label}</span>
              <span class="breakdown-score">${b.score}<span class="breakdown-max">/${b.max}</span></span>
            </div>
            <div class="breakdown-bar-bg">
              <div class="breakdown-bar-fill" style="width:${pct}%;background:${barColor}"></div>
            </div>
            <div class="breakdown-note">${b.note}</div>
          </div>`;
      }).join("")}
    </div>`;

  // Tips
  const tips = breakdown.filter(b=>b.tip).map(b=>b.tip);
  document.getElementById("scoreTips").innerHTML = tips.length ? `
    <div class="score-tips-box">
      <div class="score-tips-title">💡 How to improve</div>
      ${tips.map(t=>`<div class="score-tip-item">→ ${t}</div>`).join("")}
    </div>` : `<div class="score-tips-box all-good">✅ You're doing great! Keep tracking and stay consistent.</div>`;
}

// ══════════════════════════════════════════════
//  IMPORT CSV
// ══════════════════════════════════════════════
document.getElementById("importBtn").addEventListener("click", () => {
  document.getElementById("importFile").click();
});

document.getElementById("importFile").addEventListener("change", e => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const lines = ev.target.result.split("\n").filter(l=>l.trim());
    let imported=0, skipped=0;
    lines.slice(1).forEach(line => {
      const cols = line.split(",").map(c=>c.replace(/^"|"$/g,"").trim());
      const [date,text,category,amount,,note] = cols;
      const amt = parseFloat(amount);
      if(!text||isNaN(amt)){ skipped++; return; }
      transactions.unshift({ id:Date.now()+Math.random(), text, amount:amt,
        category:category||"Other", note:note||"", date:date||today(), recurring:null });
      imported++;
    });
    save(); render();
    showToast(`Imported ${imported} transactions${skipped?`, skipped ${skipped}`:""}`);
  };
  reader.readAsText(file);
  e.target.value="";
});

// ══════════════════════════════════════════════
//  EXPORT CSV
// ══════════════════════════════════════════════
document.getElementById("exportBtn").addEventListener("click", () => {
  if(!transactions.length) return showToast("No transactions to export");
  const rows = transactions.map(t=>
    [t.date,`"${t.text}"`,`"${t.category}"`,t.amount,getCurrency().code,`"${t.note||""}"`,t.recurring||""].join(",")
  );
  download(["Date,Description,Category,Amount,Currency,Note,Recurring",...rows].join("\n"),
    `fintrack_${today()}.csv`,"text/csv");
  showToast("CSV exported ✓");
});

// ══════════════════════════════════════════════
//  FILTERS
// ══════════════════════════════════════════════
searchInput.addEventListener("input", render);
monthFilter.addEventListener("change", render);
function switchChart(type,btn){
  currentChartType=type;
  document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active"); render();
}

// ══════════════════════════════════════════════
//  RENDER
// ══════════════════════════════════════════════
function render(){
  const searchQ = searchInput.value.toLowerCase();
  const monthQ  = monthFilter.value;
  let income=0, expenseTotal=0, categoryTotals={};

  transactions.forEach(t=>{
    if(t.amount>0) income+=t.amount;
    else expenseTotal+=Math.abs(t.amount);
    if(t.amount<0) categoryTotals[t.category]=(categoryTotals[t.category]||0)+Math.abs(t.amount);
  });

  const balance = income-expenseTotal;
  animateCounter(balanceEl,balance,true);
  animateCounter(incomeEl,income,false);
  animateCounter(expenseEl,expenseTotal,false);
  const sv = income>0 ? Math.max(0,((balance/income)*100).toFixed(0)) : 0;
  savingsEl.textContent=`${sv}%`;
  balanceEl.style.color = balance>=0?"var(--income)":"var(--expense)";
  balanceBar.style.width = income>0?`${Math.min(100,(balance/income)*100)}%`:"0%";

  // Update savings card color
  const savCard = document.querySelector(".savings-card");
  if(savCard){
    savCard.style.borderTopColor = sv>=30?"var(--income)":sv>=10?"var(--warning)":"var(--expense)";
  }

  const filtered = transactions.filter(t=>{
    const s = t.text.toLowerCase().includes(searchQ)||t.category.toLowerCase().includes(searchQ)||(t.note||"").toLowerCase().includes(searchQ);
    const m = !monthQ||t.date.startsWith(monthQ);
    return s&&m;
  });

  listEl.innerHTML="";
  emptyState.style.display = filtered.length?"none":"block";

  filtered.forEach(t=>{
    const isInc = t.amount>0;
    const li=document.createElement("li");
    li.dataset.id=t.id;
    li.innerHTML=`
      <div class="swipe-delete-bg">🗑</div>
      <div class="tx-icon ${isInc?"income":"expense"}">${getIcon(t.category)}</div>
      <div class="tx-info">
        <div class="tx-name" title="${t.text}">${t.text}${t.recurring?` <span class="recurring-badge">🔁 ${t.recurring}</span>`:""}</div>
        <div class="tx-meta">${t.category}${t.note?" · "+t.note:""}</div>
      </div>
      <div class="tx-right">
        <div class="tx-amount ${isInc?"income":"expense"}">${isInc?"+":"−"}${fmt(Math.abs(t.amount))}</div>
        <div class="tx-date">${formatDate(t.date)}</div>
      </div>
      <button class="delete-btn" onclick="deleteTransaction(${t.id})" title="Delete">✕</button>`;
    addSwipeToDelete(li,t.id);
    listEl.appendChild(li);
  });

  updateMainChart(categoryTotals);
  renderBudgets(categoryTotals);
  renderGoals();
  renderDueSoon();
}

// ══════════════════════════════════════════════
//  ANIMATED COUNTER
// ══════════════════════════════════════════════
function animateCounter(el,target){
  const duration=600, start=Date.now();
  const tick=()=>{
    const elapsed=Date.now()-start;
    const progress=Math.min(elapsed/duration,1);
    const ease=1-Math.pow(1-progress,3);
    el.textContent=fmt(target*ease);
    if(progress<1) requestAnimationFrame(tick);
    else el.textContent=fmt(target);
  };
  requestAnimationFrame(tick);
}

// ══════════════════════════════════════════════
//  CONFETTI
// ══════════════════════════════════════════════
function fireConfetti(){
  if(typeof confetti==="undefined") return;
  confetti({particleCount:120,spread:80,origin:{y:0.6},colors:["#6366f1","#10b981","#f59e0b","#ec4899"]});
}

function checkMilestone(){
  let income=0,expense=0;
  transactions.forEach(t=>{ if(t.amount>0) income+=t.amount; else expense+=Math.abs(t.amount); });
  const sv=income>0?((income-expense)/income)*100:0;
  const prev=parseFloat(localStorage.getItem("ft_last_sv")||0);
  if(sv>=50&&prev<50){ showToast("🎉 You crossed 50% savings rate!"); fireConfetti(); }
  if(sv>=75&&prev<75){ showToast("🚀 Amazing! 75% savings rate!");   fireConfetti(); }
  localStorage.setItem("ft_last_sv",sv.toFixed(1));
}

// ══════════════════════════════════════════════
//  SWIPE TO DELETE
// ══════════════════════════════════════════════
function addSwipeToDelete(li,id){
  let startX=0, currentX=0, swiping=false;
  const bg=li.querySelector(".swipe-delete-bg");

  li.addEventListener("touchstart",e=>{ startX=e.touches[0].clientX; swiping=true; },{passive:true});
  li.addEventListener("touchmove",e=>{
    if(!swiping) return;
    currentX=e.touches[0].clientX-startX;
    if(currentX<0){
      const shift=Math.max(currentX,-80);
      li.style.transform=`translateX(${shift}px)`;
      bg.style.opacity=Math.min(Math.abs(shift)/80,1);
    }
  },{passive:true});
  li.addEventListener("touchend",()=>{
    swiping=false;
    if(currentX<-60){
      li.style.transform="translateX(-100%)"; li.style.opacity="0"; li.style.transition="all .25s ease";
      setTimeout(()=>deleteTransaction(id),250);
    } else { li.style.transform=""; bg.style.opacity="0"; }
    currentX=0;
  });
}

// ══════════════════════════════════════════════
//  MAIN CHART
// ══════════════════════════════════════════════
function updateMainChart(data){
  const labels=Object.keys(data), values=Object.values(data);
  if(chart) chart.destroy();
  if(!labels.length){ noChartData.style.display="block"; return; }
  noChartData.style.display="none";
  const isDark=document.body.classList.contains("dark");
  const textColor=isDark?"#e8edf5":"#0d1117";
  const gridColor=isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)";

  if(currentChartType==="doughnut"){
    chart=new Chart(ctx,{
      type:"doughnut",
      data:{labels,datasets:[{data:values,backgroundColor:COLORS,borderWidth:2,borderColor:"transparent"}]},
      options:{responsive:true,cutout:"65%",
        plugins:{legend:{labels:{color:textColor,font:{family:"Sora",size:12},padding:16}},
          tooltip:{callbacks:{label:c=>` ${fmt(c.parsed)} (${((c.parsed/values.reduce((a,b)=>a+b,0))*100).toFixed(1)}%)`}}}}
    });
  } else {
    chart=new Chart(ctx,{
      type:"bar",
      data:{labels,datasets:[{label:"Expenses",data:values,backgroundColor:COLORS,borderRadius:8,borderSkipped:false}]},
      options:{responsive:true,
        plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${fmt(c.parsed.y)}`}}},
        scales:{x:{ticks:{color:textColor,font:{family:"Sora"}},grid:{color:gridColor}},
                y:{ticks:{color:textColor,font:{family:"Sora"},callback:v=>fmt(v)},grid:{color:gridColor}}}}
    });
  }
}

// ══════════════════════════════════════════════
//  BUDGET RENDER
// ══════════════════════════════════════════════
function renderBudgets(categoryTotals){
  const entries=Object.entries(budgets);
  if(!entries.length){ budgetListEl.innerHTML=""; return; }
  budgetListEl.innerHTML=entries.map(([cat,limit])=>{
    const spent=categoryTotals[cat]||0;
    const pct=Math.min(100,(spent/limit)*100);
    const status=spent>=limit?"over":pct>=80?"near":"ok";
    const label=status==="over"?"⚠ Over budget":status==="near"?"⚡ Almost there":"✓ On track";
    const color=status==="over"?"var(--expense)":status==="near"?"var(--warning)":"var(--income)";
    return `
      <div class="budget-item ${status}">
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:600;font-size:.82rem">${getIcon(cat)} ${cat}</span>
            <button class="budget-remove" onclick="removeBudget('${cat}')" title="Remove">✕</button>
          </div>
          <div class="budget-bar-wrap">
            <div class="budget-bar" style="width:${pct}%;background:${color}"></div>
          </div>
        </div>
        <div style="text-align:right;font-size:.78rem;margin-left:10px;flex-shrink:0">
          <div>${fmt(spent)} / ${fmt(limit)}</div>
          <div style="margin-top:2px">${label}</div>
        </div>
      </div>`;
  }).join("");
}

// ══════════════════════════════════════════════
//  CURRENCY MODAL
// ══════════════════════════════════════════════
document.getElementById("currencyBtn").addEventListener("click", openCurrencyModal);

function openCurrencyModal(){
  document.getElementById("currencyModal").style.display="flex";
  document.body.style.overflow="hidden";
  const c=getCurrency();
  document.getElementById("currentCurrencyLabel").textContent=`Current: ${c.flag} ${c.name}`;
  renderCurrencyGrid(""); document.getElementById("currencySearch").value="";
}
function closeCurrencyModal(){ document.getElementById("currencyModal").style.display="none"; document.body.style.overflow=""; }
function currencyOverlayClose(e){ if(e.target===document.getElementById("currencyModal")) closeCurrencyModal(); }

document.getElementById("currencySearch").addEventListener("input",e=>{ renderCurrencyGrid(e.target.value.toLowerCase()); });

function renderCurrencyGrid(query){
  const grid=document.getElementById("currencyGrid");
  const list=query?CURRENCIES.filter(c=>c.name.toLowerCase().includes(query)||c.code.toLowerCase().includes(query)||c.symbol.includes(query)):CURRENCIES;
  if(!list.length){ grid.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--muted)">No currencies found</div>`; return; }
  grid.innerHTML=list.map(c=>`
    <div class="currency-item ${c.code===activeCurrencyCode?"active":""}" onclick="selectCurrency('${c.code}')">
      <span class="currency-flag">${c.flag}</span>
      <div class="currency-info">
        <div class="currency-code">${c.code}</div>
        <div class="currency-name">${c.name}</div>
        <div class="currency-symbol">${c.symbol}</div>
      </div>
    </div>`).join("");
}

function selectCurrency(code){
  activeCurrencyCode=code;
  localStorage.setItem("ft_currency",code);
  closeCurrencyModal(); updateCurrencyUI(); render();
  showToast(`Currency: ${getCurrency().flag} ${getCurrency().code}`);
}

function updateCurrencyUI(){
  const c=getCurrency();
  brandIcon.textContent=c.symbol;
  amountPrefix.textContent=c.symbol;
}

// ══════════════════════════════════════════════
//  REPORT
// ══════════════════════════════════════════════
document.getElementById("reportBtn").addEventListener("click", openReport);

function openReport(){
  if(!transactions.length) return showToast("Add transactions first");
  buildReport();
  document.getElementById("reportModal").style.display="flex";
  document.body.style.overflow="hidden";
}

function closeReport(){
  document.getElementById("reportModal").style.display="none";
  document.body.style.overflow="";
  [rLineChart,rDonutChart,rBarChart].forEach(c=>{if(c)c.destroy();});
  rLineChart=rDonutChart=rBarChart=null;
}

function overlayClose(e){ if(e.target===document.getElementById("reportModal")) closeReport(); }

function buildReport(){
  const isDark=document.body.classList.contains("dark");
  const textColor=isDark?"#e8edf5":"#0d1117";
  const gridColor=isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)";

  let totalIncome=0,totalExpense=0,catTotals={},monthMap={};
  transactions.forEach(t=>{
    const mo=t.date?t.date.slice(0,7):"Unknown";
    if(!monthMap[mo]) monthMap[mo]={income:0,expense:0};
    if(t.amount>0){totalIncome+=t.amount;monthMap[mo].income+=t.amount;}
    else{totalExpense+=Math.abs(t.amount);monthMap[mo].expense+=Math.abs(t.amount);}
    if(t.amount<0) catTotals[t.category]=(catTotals[t.category]||0)+Math.abs(t.amount);
  });

  const balance=totalIncome-totalExpense;
  const savings=totalIncome>0?((balance/totalIncome)*100).toFixed(1):0;
  const months=Object.keys(monthMap).sort();
  const c=getCurrency();

  document.getElementById("reportPeriod").textContent=
    months.length?`${formatMonth(months[0])} – ${formatMonth(months[months.length-1])} · ${transactions.length} transactions · ${c.flag} ${c.code}`:"";

  document.getElementById("reportSummary").innerHTML=[
    {label:"Total Income",  value:fmt(totalIncome),           color:"var(--income)"},
    {label:"Total Expenses",value:fmt(totalExpense),          color:"var(--expense)"},
    {label:"Net Balance",   value:fmt(balance),               color:balance>=0?"var(--income)":"var(--expense)"},
    {label:"Savings Rate",  value:`${Math.max(0,savings)}%`,  color:"var(--primary)"},
    {label:"Avg Monthly",   value:fmt(months.length?totalExpense/months.length:0), color:"var(--muted)"},
    {label:"Transactions",  value:transactions.length,         color:"var(--text)"},
  ].map(s=>`<div class="rs-card"><div class="rs-label">${s.label}</div><div class="rs-value" style="color:${s.color}">${s.value}</div></div>`).join("");

  [rLineChart,rDonutChart,rBarChart].forEach(c=>{if(c)c.destroy();});
  const cd={responsive:true,maintainAspectRatio:false};

  const lineCtx=document.getElementById("rLineChart").getContext("2d");
  document.getElementById("rLineChart").style.height="180px";
  rLineChart=new Chart(lineCtx,{
    type:"line",
    data:{labels:months.map(formatMonth),datasets:[
      {label:"Income",  data:months.map(m=>monthMap[m].income), borderColor:"#10b981",backgroundColor:"rgba(16,185,129,.12)",tension:.4,fill:true,pointRadius:4,pointBackgroundColor:"#10b981"},
      {label:"Expenses",data:months.map(m=>monthMap[m].expense),borderColor:"#f43f5e",backgroundColor:"rgba(244,63,94,.12)",tension:.4,fill:true,pointRadius:4,pointBackgroundColor:"#f43f5e"}
    ]},
    options:{...cd,plugins:{legend:{labels:{color:textColor,font:{family:"Sora",size:11}}},tooltip:{callbacks:{label:c=>` ${fmt(c.parsed.y)}`}}},
      scales:{x:{ticks:{color:textColor,font:{family:"Sora",size:10}},grid:{color:gridColor}},
              y:{ticks:{color:textColor,font:{family:"Sora",size:10},callback:v=>fmt(v)},grid:{color:gridColor}}}}
  });

  const dCtx=document.getElementById("rDonutChart").getContext("2d");
  document.getElementById("rDonutChart").style.height="180px";
  const catLabels=Object.keys(catTotals),catValues=Object.values(catTotals);
  rDonutChart=new Chart(dCtx,{
    type:"doughnut",
    data:{labels:catLabels,datasets:[{data:catValues,backgroundColor:COLORS,borderWidth:2,borderColor:"transparent"}]},
    options:{...cd,cutout:"60%",plugins:{legend:{position:"bottom",labels:{color:textColor,font:{family:"Sora",size:10},padding:10,boxWidth:10}},
      tooltip:{callbacks:{label:c=>` ${fmt(c.parsed)} (${((c.parsed/(catValues.reduce((a,b)=>a+b,0)||1))*100).toFixed(1)}%)`}}}}
  });

  const bCtx=document.getElementById("rBarChart").getContext("2d");
  document.getElementById("rBarChart").style.height="180px";
  const netValues=months.map(m=>monthMap[m].income-monthMap[m].expense);
  rBarChart=new Chart(bCtx,{
    type:"bar",
    data:{labels:months.map(formatMonth),datasets:[{label:"Net",data:netValues,
      backgroundColor:netValues.map(v=>v>=0?"rgba(16,185,129,.75)":"rgba(244,63,94,.75)"),borderRadius:6,borderSkipped:false}]},
    options:{...cd,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${fmt(c.parsed.y)}`}}},
      scales:{x:{ticks:{color:textColor,font:{family:"Sora",size:10}},grid:{color:gridColor}},
              y:{ticks:{color:textColor,font:{family:"Sora",size:10},callback:v=>fmt(v)},grid:{color:gridColor}}}}
  });

  const sortedCats=Object.entries(catTotals).sort((a,b)=>b[1]-a[1]);
  document.getElementById("reportCatTable").innerHTML=sortedCats.length?`
    <table class="r-table"><thead><tr><th>Category</th><th>Spent</th><th>% of Expenses</th><th>Transactions</th></tr></thead>
    <tbody>${sortedCats.map(([cat,amt])=>{
      const count=transactions.filter(t=>t.category===cat&&t.amount<0).length;
      const pct=totalExpense>0?((amt/totalExpense)*100).toFixed(1):0;
      return `<tr><td>${getIcon(cat)} ${cat}</td><td style="font-family:'JetBrains Mono',monospace;font-weight:600">${fmt(amt)}</td>
        <td><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:6px;background:var(--border);border-radius:99px;overflow:hidden"><div style="width:${Math.min(100,parseFloat(pct))}%;height:100%;background:var(--primary);border-radius:99px"></div></div><span style="font-size:.78rem;color:var(--muted);width:36px">${pct}%</span></div></td>
        <td style="color:var(--muted)">${count}</td></tr>`;
    }).join("")}</tbody></table>`:`<div class="empty-state">No expense data</div>`;

  const top5Exp=[...transactions].filter(t=>t.amount<0).sort((a,b)=>a.amount-b.amount).slice(0,5);
  document.getElementById("reportTopExp").innerHTML=top5Exp.length
    ?top5Exp.map((t,i)=>`<div class="top-tx-item"><div class="top-tx-rank">${i+1}</div><div class="tx-icon expense" style="width:30px;height:30px;font-size:.85rem">${getIcon(t.category)}</div><div class="top-tx-info"><div class="top-tx-name">${t.text}</div><div class="top-tx-cat">${t.category} · ${formatDate(t.date)}</div></div><div class="top-tx-amt expense-text">−${fmt(Math.abs(t.amount))}</div></div>`).join("")
    :`<div class="empty-state">No expenses</div>`;

  const top5Inc=[...transactions].filter(t=>t.amount>0).sort((a,b)=>b.amount-a.amount).slice(0,5);
  document.getElementById("reportTopInc").innerHTML=top5Inc.length
    ?top5Inc.map((t,i)=>`<div class="top-tx-item"><div class="top-tx-rank" style="background:var(--income-bg);color:var(--income)">${i+1}</div><div class="tx-icon income" style="width:30px;height:30px;font-size:.85rem">${getIcon(t.category)}</div><div class="top-tx-info"><div class="top-tx-name">${t.text}</div><div class="top-tx-cat">${t.category} · ${formatDate(t.date)}</div></div><div class="top-tx-amt income-text">+${fmt(t.amount)}</div></div>`).join("")
    :`<div class="empty-state">No income records</div>`;

  document.getElementById("reportMonthTable").innerHTML=`
    <table class="r-table"><thead><tr><th>Month</th><th>Income</th><th>Expenses</th><th>Net</th><th>Savings %</th></tr></thead>
    <tbody>${months.slice().reverse().map(mo=>{
      const{income:inc,expense:exp}=monthMap[mo];
      const net=inc-exp, sv=inc>0?((net/inc)*100).toFixed(0):"—";
      return `<tr><td style="font-weight:600">${formatMonth(mo)}</td><td class="income-text" style="font-family:'JetBrains Mono',monospace">+${fmt(inc)}</td><td class="expense-text" style="font-family:'JetBrains Mono',monospace">−${fmt(exp)}</td><td style="font-family:'JetBrains Mono',monospace;font-weight:700;color:${net>=0?"var(--income)":"var(--expense)"}">${net>=0?"+":""}${fmt(net)}</td><td><span class="pill ${sv==="—"?"":"income"}">${sv==="—"?"—":sv+"%"}</span></td></tr>`;
    }).join("")}</tbody></table>`;
}

function exportReport(){ window.print(); }

// ══════════════════════════════════════════════
//  THEME
// ══════════════════════════════════════════════
themeToggle.addEventListener("click",()=>{
  darkMode=!darkMode;
  document.body.classList.toggle("dark",darkMode);
  themeToggle.textContent=darkMode?"☀️":"🌙";
  localStorage.setItem("ft_dark",darkMode);
  render();
});

// ══════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════
function save()      { localStorage.setItem("ft_transactions",JSON.stringify(transactions)); }
function saveBudgets(){ localStorage.setItem("ft_budgets",JSON.stringify(budgets)); }
function saveGoals() { localStorage.setItem("ft_goals",JSON.stringify(goals)); }
function saveBills() { localStorage.setItem("ft_bills",JSON.stringify(bills)); }
function today()     { return new Date().toISOString().split("T")[0]; }

function formatDate(str){
  if(!str) return "";
  return new Date(str+"T00:00:00").toLocaleDateString(getCurrency().locale,{day:"2-digit",month:"short",year:"2-digit"});
}
function formatMonth(str){
  if(!str||str==="Unknown") return str;
  const[y,m]=str.split("-");
  return new Date(y,m-1).toLocaleDateString(getCurrency().locale,{month:"short",year:"numeric"});
}
function showToast(msg){
  toastEl.textContent=msg;
  toastEl.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t=setTimeout(()=>toastEl.classList.remove("show"),2600);
}
function download(content,filename,type){
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([content],{type}));
  a.download=filename; a.click();
}

// ══════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════
document.getElementById("date").value=today();
updateCurrencyUI();
processRecurring();
render();
renderDueSoon();
// Add this function somewhere in your JS file
async function fetchFinTrackInsight() {
  const rawTotals = localStorage.getItem('fintrack_totals'); 
  const spendingData = rawTotals ? JSON.parse(rawTotals) : { message: "No data yet." };

  try {
    // We are calling YOUR new secure file, not Google directly
    const response = await fetch('/api/insight', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spendingData: spendingData })
    });

    const data = await response.json();

    if (data.insight) {
      console.log("Insight generated!");
      // Make sure you have an element with id="insight-box" in your HTML
      document.getElementById('insight-box').innerText = data.insight;
    } else {
      console.error("Error generating insight:", data.error);
    }
  } catch (error) {
    console.error("Fetch request failed:", error);
  }
}

// Example of how to trigger it when a button is clicked
// Make sure you have a button with id="generate-btn" in your HTML
document.getElementById('generate-btn').addEventListener('click', async () => {
  document.getElementById('insight-box').innerText = "Analyzing your spending...";
  await fetchFinTrackInsight();
});