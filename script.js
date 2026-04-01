const { jsPDF } = window.jspdf;
let currentDate = new Date();
currentDate.setHours(0, 0, 0, 0);
let products = [];
let credits = [];
let allData = JSON.parse(localStorage.getItem("commercialData")) || {};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', function() {
    setupFormEventListeners();
    setupTabEventListeners();
    setupMarginInputListeners();
    loadDayData(currentDate);

    // Initialize Datepicker
    $("#datepicker").datepicker({
        language: "fr",
        autoClose: true,
        dateFormat: "dd-mm-yyyy",
        onSelect: function(formattedDate) {
            const parts = formattedDate.split("-");
            const selectedDate = new Date(parts[2], parts[1] - 1, parts[0]);
            selectedDate.setHours(0, 0, 0, 0);
            loadDayData(selectedDate);
        }
    });

    $("#calendarTrigger").click(function() {
        $("#datepicker").data("datepicker").show();
    });
});

// --- Date Helpers ---
function formatDate(date) {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${d}-${m}-${date.getFullYear()}`;
}

function formatDateForDisplay(date) {
    return date.toLocaleDateString("ar-AR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function updateDateDisplay() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dd = document.getElementById("currentDayDisplay");
    dd.textContent = formatDateForDisplay(currentDate);
    document.getElementById("currentDate").textContent = "Système: " + formatDate(currentDate);
    currentDate.getTime() === today.getTime() ? dd.classList.add("today-highlight") : dd.classList.remove("today-highlight");
}

function changeDay(days) {
    saveMarginInputs();
    const nd = new Date(currentDate);
    nd.setDate(nd.getDate() + days);
    loadDayData(nd);
}

// --- Data Management ---
function loadDayData(date) {
    currentDate = date;
    updateDateDisplay();
    const dateKey = formatDate(date);
    
    if (!allData[dateKey]) allData[dateKey] = { products: [], credits: [], marginData: null };
    
    resetMarginInputs();
    products = allData[dateKey].products || [];
    credits = allData[dateKey].credits || [];
    
    renderProducts();
    renderCredits();
    updateStats();
    loadMarginData();
}

function saveData() {
    const dateKey = formatDate(currentDate);
    const currentMarginData = allData[dateKey]?.marginData || null;
    allData[dateKey] = { products, credits, marginData: currentMarginData };
    localStorage.setItem("commercialData", JSON.stringify(allData));
    document.getElementById("backupStatus").textContent = "Données mises à jour - " + new Date().toLocaleTimeString();
}

// --- Margin Calculations ---
function calculateMargin() {
    const yesterdayCash = parseFloat(document.getElementById("yesterdayCash").value) || 0;
    const todayCash = parseFloat(document.getElementById("todayCash").value) || 0;
    const yesterdayDeler = parseFloat(document.getElementById("yesterdayDeler").value) || 0;
    const inwiRecharge = parseFloat(document.getElementById("inwiRecharge").value) || 0;
    const orangeRecharge = parseFloat(document.getElementById("orangeRecharge").value) || 0;
    const iamRecharge = parseFloat(document.getElementById("iamRecharge").value) || 0;
    const totalRecharges = inwiRecharge + orangeRecharge + iamRecharge;
    const remainingInwi = parseFloat(document.getElementById("remainingInwi").value) || 0;
    const remainingOrange = parseFloat(document.getElementById("remainingOrange").value) || 0;
    const remainingIAM = parseFloat(document.getElementById("remainingIAM").value) || 0;
    const totalRemaining = remainingInwi + remainingOrange + remainingIAM;
    const remainingCashe = parseFloat(document.getElementById("remainingCashe").value) || 0;
    const totalSales = parseFloat(document.getElementById("totalSales").textContent.replace(" DH", "")) || 0;
    const pendingCredits = parseFloat(document.getElementById("pendingCredits").textContent.replace(" DH", "")) || 0;

    const totalDealersToday = remainingInwi + remainingOrange + remainingIAM;
    document.getElementById("totalDealersToday").textContent = `مجموع الباقي في الديلرات اليوم : ${totalDealersToday.toFixed(2)} DH`;

    const margin = -1 * (yesterdayDeler + totalRecharges - totalRemaining + totalSales - pendingCredits - todayCash + yesterdayCash) + remainingCashe;

    const marginResult = document.getElementById("marginResult");
    marginResult.textContent = (margin < 0 ? "" : "+") + margin.toFixed(2) + " DH ";
    marginResult.style.color = margin < 0 ? "var(--red)" : "var(--green)";

    const dateKey = formatDate(currentDate);
    allData[dateKey].marginData = { 
        yesterdayCash, todayCash, yesterdayDeler, 
        recharges: { inwi: inwiRecharge, orange: orangeRecharge, iam: iamRecharge, total: totalRecharges }, 
        remaining: { inwi: remainingInwi, orange: remainingOrange, iam: remainingIAM, total: totalRemaining, cashe: remainingCashe }, 
        totalSales, pendingCredits, margin, totalDealersToday 
    };
    
    localStorage.setItem("commercialData", JSON.stringify(allData));
    document.getElementById("backupStatus").textContent = "Données mises à jour - " + new Date().toLocaleTimeString();
    return margin;
}

function saveMarginInputs() {
    const dateKey = formatDate(currentDate);
    if (!allData[dateKey]) allData[dateKey] = { products: [], credits: [], marginData: null };
    
    const existingCalculation = allData[dateKey].marginData?.margin || 0;
    const existingDealersTotal = allData[dateKey].marginData?.totalDealersToday || 0;
    
    allData[dateKey].marginData = {
        yesterdayCash: parseFloat(document.getElementById("yesterdayCash").value) || 0,
        todayCash: parseFloat(document.getElementById("todayCash").value) || 0,
        yesterdayDeler: parseFloat(document.getElementById("yesterdayDeler").value) || 0,
        recharges: { 
            inwi: parseFloat(document.getElementById("inwiRecharge").value) || 0, 
            orange: parseFloat(document.getElementById("orangeRecharge").value) || 0, 
            iam: parseFloat(document.getElementById("iamRecharge").value) || 0, 
            total: 0 
        },
        remaining: { 
            inwi: parseFloat(document.getElementById("remainingInwi").value) || 0, 
            orange: parseFloat(document.getElementById("remainingOrange").value) || 0, 
            iam: parseFloat(document.getElementById("remainingIAM").value) || 0, 
            cashe: parseFloat(document.getElementById("remainingCashe").value) || 0, 
            total: 0 
        },
        margin: existingCalculation, 
        totalDealersToday: existingDealersTotal,
        totalSales: parseFloat(document.getElementById("totalSales").textContent.replace(" DH", "")) || 0,
        pendingCredits: parseFloat(document.getElementById("pendingCredits").textContent.replace(" DH", "")) || 0,
        lastUpdated: new Date().toISOString()
    };
    
    allData[dateKey].marginData.recharges.total = allData[dateKey].marginData.recharges.inwi + allData[dateKey].marginData.recharges.orange + allData[dateKey].marginData.recharges.iam;
    allData[dateKey].marginData.remaining.total = allData[dateKey].marginData.remaining.inwi + allData[dateKey].marginData.remaining.orange + allData[dateKey].marginData.remaining.iam;
    
    localStorage.setItem("commercialData", JSON.stringify(allData));
}

function loadMarginData() {
    const dateKey = formatDate(currentDate);
    if (!allData[dateKey] || !allData[dateKey].marginData) return;
    const marginData = allData[dateKey].marginData;
    const updateField = (id, value) => { 
        const el = document.getElementById(id); 
        if (el && value !== undefined) el.value = value; 
    };

    updateField("yesterdayCash", marginData.yesterdayCash); 
    updateField("todayCash", marginData.todayCash); 
    updateField("yesterdayDeler", marginData.yesterdayDeler);
    updateField("inwiRecharge", marginData.recharges?.inwi); 
    updateField("orangeRecharge", marginData.recharges?.orange); 
    updateField("iamRecharge", marginData.recharges?.iam);
    updateField("remainingInwi", marginData.remaining?.inwi); 
    updateField("remainingOrange", marginData.remaining?.orange); 
    updateField("remainingIAM", marginData.remaining?.iam); 
    updateField("remainingCashe", marginData.remaining?.cashe);

    // Display totalDealersToday for the selected day
    if (typeof marginData.totalDealersToday === "number") {
        document.getElementById("totalDealersToday").textContent = `مجموع الباقي في الديلرات اليوم : ${marginData.totalDealersToday.toFixed(2)} DH`;
    } else {
        document.getElementById("totalDealersToday").textContent = "مجموع الباقي في الديلرات اليوم";
    }

    if (marginData.margin !== undefined) {
        document.getElementById("marginResult").textContent = marginData.margin.toFixed(2) + " DH";
    }
}

function resetMarginInputs() {
    ["yesterdayCash","todayCash","yesterdayDeler","inwiRecharge","orangeRecharge","iamRecharge","remainingInwi","remainingOrange","remainingIAM","remainingCashe"].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = "";
    });
    document.getElementById("marginResult").textContent = "0.00 DH";
}

// --- UI Rendering ---
function renderProducts() {
    const pl = document.getElementById("productList");
    if (!products.length) { 
        pl.innerHTML = `<div class="empty-state"><i class="fas fa-box-open"></i><p>لا يوجد منتوج</p></div>`; 
        return; 
    }
    pl.innerHTML = "";
    products.forEach(p => {
        const item = document.createElement("div"); 
        item.className = "item";
        item.innerHTML = `
            <div class="item-info">
                <div class="item-name">${p.name}</div>
                <div class="item-details">${p.price} DH · ${formatDate(new Date(p.date))}</div>
            </div>
            <div class="item-actions">
                <button class="btn-danger" data-id="${p.id}" data-type="product"><i class="fas fa-trash-alt"></i> حذف</button>
            </div>`;
        pl.appendChild(item);
    });
}

function renderCredits() {
    const cl = document.getElementById("creditList");
    if (!credits.length) { 
        cl.innerHTML = `<div class="empty-state"><i class="fas fa-hand-holding-usd"></i><p>لا يوجد كريدي مسجل</p></div>`; 
        return; 
    }
    cl.innerHTML = "";
    credits.forEach(c => {
        const item = document.createElement("div"); 
        item.className = "item";
        item.innerHTML = `
            <div class="item-info">
                <div class="item-name">${c.borrower} — ${c.type}</div>
                <div class="item-details">${c.amount} DH · ${formatDate(new Date(c.date))}</div>
            </div>
            <div class="item-actions">
                <button class="${c.paid ? 'btn-warning' : 'btn-success'}" data-id="${c.id}" data-type="credit" data-action="toggle">
                    <i class="fas fa-${c.paid ? 'undo' : 'check'}"></i> ${c.paid ? 'باقي بلا خلاص' : 'كريدي تخلص'}
                </button>
                <button class="btn-danger" data-id="${c.id}" data-type="credit" data-action="delete">
                    <i class="fas fa-trash-alt"></i> حذف
                </button>
            </div>
            <span class="badge ${c.paid ? 'badge-paid' : 'badge-pending'}">
                <i class="fas fa-${c.paid ? 'check-circle' : 'exclamation-circle'}"></i> ${c.paid ? 'مخلص' : 'باقي مامخلص'}
            </span>`;
        cl.appendChild(item);
    });
}

function updateStats() {
    const ts = products.reduce((s, p) => s + parseFloat(p.price), 0);
    const tc = credits.reduce((s, c) => s + parseFloat(c.amount), 0);
    const pc = credits.reduce((s, c) => !c.paid ? s + parseFloat(c.amount) : s, 0);
    document.getElementById("totalSales").textContent = ts.toFixed(2) + " DH";
    document.getElementById("totalCredits").textContent = tc.toFixed(2) + " DH";
    document.getElementById("pendingCredits").textContent = pc.toFixed(2) + " DH";
}

// --- Event Listeners ---
function setupFormEventListeners() {
    document.getElementById("productForm").addEventListener("submit", function(e) {
        e.preventDefault();
        const productName = document.getElementById("productName").value.trim();
        const productPrice = parseFloat(document.getElementById("productPrice").value);
        if (productName && !isNaN(productPrice)) {
            products.push({ id: Date.now(), name: productName, price: productPrice.toFixed(2), sold: true, date: currentDate.toISOString() });
            saveData(); renderProducts(); updateStats(); this.reset();
        }
    });

    document.getElementById("creditForm").addEventListener("submit", function(e) {
        e.preventDefault();
        const borrowerName = document.getElementById("borrowerName").value.trim();
        const creditType = document.getElementById("creditType").value.trim();
        const creditAmount = parseFloat(document.getElementById("creditAmount").value);
        if (borrowerName && creditType && !isNaN(creditAmount)) {
            credits.push({ id: Date.now(), borrower: borrowerName, type: creditType, amount: creditAmount.toFixed(2), paid: false, date: currentDate.toISOString() });
            saveData(); renderCredits(); updateStats(); this.reset();
        }
    });

    document.addEventListener("click", function(e) {
        const btn = e.target.tagName === "BUTTON" ? e.target : e.target.closest("button");
        if (!btn) return;

        const id = parseInt(btn.dataset.id);
        const type = btn.dataset.type;
        const action = btn.dataset.action;

        if (type === "product") {
            if (confirm("حذف هذا المنتج ?")) {
                products = products.filter(p => p.id !== id);
                saveData(); renderProducts(); updateStats();
            }
        } else if (type === "credit") {
            if (action === "toggle") {
                credits = credits.map(c => c.id === id ? {...c, paid: !c.paid} : c);
                saveData(); renderCredits(); updateStats();
            } else if (action === "delete") {
                if (confirm("حذف هذا الكريدي ?")) {
                    credits = credits.filter(c => c.id !== id);
                    saveData(); renderCredits(); updateStats();
                }
            }
        }
    });
}

function setupTabEventListeners() {
    const tabs = document.querySelectorAll(".tab");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
            document.getElementById(tab.dataset.tab).classList.add("active");
        });
    });
}

function setupMarginInputListeners() {
    const marginInputIds = ["yesterdayCash","todayCash","yesterdayDeler","inwiRecharge","orangeRecharge","iamRecharge","remainingInwi","remainingOrange","remainingIAM","remainingCashe"];
    marginInputIds.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', () => { saveMarginInputs(); showAutoSaveNotification(); });
            if (id.startsWith('remaining')) {
                input.addEventListener('input', () => {
                    const total = (parseFloat(document.getElementById("remainingInwi").value || 0) + 
                                    parseFloat(document.getElementById("remainingOrange").value || 0) + 
                                    parseFloat(document.getElementById("remainingIAM").value || 0));
                    document.getElementById("totalDealersToday").textContent = `Total de Reste des 3 Dealers : ${total.toFixed(2)} DH`;
                });
            }
        }
    });
}

function showAutoSaveNotification() {
    const status = document.getElementById("backupStatus");
    const originalText = status.textContent;
    status.textContent = "Sauvegarde automatique réussie - " + new Date().toLocaleTimeString();
    status.style.color = "#22c55e";
    setTimeout(() => { status.textContent = originalText; status.style.color = ""; }, 2000);
}

// --- PDF Export ---
function exportToPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.setTextColor(40);
    
    doc.setFontSize(12); doc.setTextColor(100);
    doc.text(`M&M Store : ${formatDate(new Date())}`, 105, 22, { align: "center" });

    // Table: Ventes
    doc.setFontSize(14); doc.setTextColor(40); doc.text("Détail des Ventes", 14, 35);
    doc.autoTable({ 
        head:[["Produit","Prix","Date"]], 
        body: products.map(p => [p.name, `${p.price} DH`, formatDate(new Date(p.date))]), 
        startY: 40, 
        theme: "grid" 
    });

    // Table: Crédits
    doc.setFontSize(14); doc.text("Détail des Crédits", 14, doc.autoTable.previous.finalY + 20);
    doc.autoTable({ 
        head:[["Client","Type","Montant","Statut","Date"]], 
        body: credits.map(c => [c.borrower, c.type, `${c.amount} DH`, c.paid?"Payé":"Impayé", formatDate(new Date(c.date))]), 
        startY: doc.autoTable.previous.finalY + 25, 
        theme: "grid" 
    });

    // Stats Section
    const tv = products.reduce((s,p) => s + parseFloat(p.price), 0);
    const ci = credits.reduce((s,c) => !c.paid ? s + parseFloat(c.amount) : s, 0);
    const yc = parseFloat(document.getElementById("yesterdayCash").value) || 0;
    const rc = parseFloat(document.getElementById("remainingCashe").value) || 0;
    const mr = document.getElementById("marginResult").textContent;

    doc.setFontSize(14); doc.text("Calcul de Marge", 14, doc.autoTable.previous.finalY + 20);
    doc.autoTable({ 
        body:[
            ["Total Ventes", `${tv.toFixed(2)} DH`],
            ["Crédits Impayés", `${ci.toFixed(2)} DH`],
            ["Fond caisse hier", `${yc.toFixed(2)} DH`],
            ["Reste Argent", `${rc.toFixed(2)} DH`],
            ["Marge Calculée", mr]
        ], 
        startY: doc.autoTable.previous.finalY + 25, 
        theme: "plain" 
    });

    doc.save(`rapport_commercial_${formatDate(currentDate)}.pdf`);
    document.getElementById("backupStatus").textContent = "PDF généré avec succès";
}