/* Structura - Control de Obras y Pagos - Javascript Controller */

// Global State Object
// Global State Object
let appState = {
  projectName: "Mi Proyecto",
  userName: "Ing. Residente",
  userRole: "Director de Obra",
  chapters: [],
  providers: [],
  materials: [],
  payments: [],
  activities: [],
  telegramConfig: { enabled: false, token: "", chatId: "" }
};

// Default Seed Data (Base Limpia Sin Ejemplos)
const defaultSeedData = {
  projectName: "Mi Proyecto",
  userName: "Ing. Residente",
  userRole: "Director de Obra",
  chapters: [],
  providers: [],
  materials: [],
  payments: [],
  activities: [
    { id: "ACT-01", text: "Sistema de control de obras inicializado.", type: "primary", time: "" }
  ],
  telegramConfig: { enabled: false, token: "", chatId: "" }
};

// Chart.js references
let barChartInstance = null;
let pieChartInstance = null;

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  loadAppState();
  setupNavigation();
  setupThemeToggle();
  setupEventListeners();
  renderDashboard();
  renderComputos();
  renderMaterials();
  renderProviders();
  renderPayments();
  renderReports();
});

// Load state from localStorage or seed database
function loadAppState() {
  const saved = localStorage.getItem("structura_db");
  if (saved) {
    try {
      appState = JSON.parse(saved);
      if (!appState.telegramConfig) {
        appState.telegramConfig = { enabled: false, token: "", chatId: "" };
      }
      if (!appState.projectName) appState.projectName = "Mi Proyecto";
      if (!appState.userName) appState.userName = "Ing. Residente";
      if (!appState.userRole) appState.userRole = "Director de Obra";
    } catch (e) {
      console.error("Error al cargar la base de datos local, usando semilla:", e);
      appState = JSON.parse(JSON.stringify(defaultSeedData));
      appState.activities[0].time = getCurrentTimeString();
    }
  } else {
    appState = JSON.parse(JSON.stringify(defaultSeedData));
    appState.activities[0].time = getCurrentTimeString();
    saveAppState();
  }
  updateProjectMetadataDOM();
}

// Update DOM elements with active project and user details
function updateProjectMetadataDOM() {
  const projBadge = document.getElementById("project-badge");
  if (projBadge) projBadge.innerText = `Obra: ${appState.projectName || 'Mi Proyecto'}`;
  
  const userDisp = document.getElementById("username-display");
  if (userDisp) userDisp.innerText = appState.userName || 'Ing. Residente';
  
  const userRole = document.getElementById("userrole-display");
  if (userRole) userRole.innerText = appState.userRole || 'Director de Obra';
  
  const userAvatar = document.getElementById("user-avatar-tag");
  if (userAvatar && appState.userName) {
    const initials = appState.userName.split(" ").map(w => w[0]).filter(Boolean).join("").substring(0, 2).toUpperCase();
    userAvatar.innerText = initials || "IR";
  }
}

// Helper to get formatted local time string
function getCurrentTimeString() {
  const now = new Date();
  return now.getFullYear() + "-" + 
         String(now.getMonth() + 1).padStart(2, '0') + "-" + 
         String(now.getDate()).padStart(2, '0') + " " + 
         String(now.getHours()).padStart(2, '0') + ":" + 
         String(now.getMinutes()).padStart(2, '0');
}

// Save current state to LocalStorage
function saveAppState() {
  localStorage.setItem("structura_db", JSON.stringify(appState));
}

// Log an activity into history
function logActivity(text, type = "primary") {
  appState.activities.unshift({
    id: "ACT-" + Date.now(),
    text,
    type,
    time: getCurrentTimeString()
  });
  
  // Cap activities at 25 items
  if (appState.activities.length > 25) {
    appState.activities.pop();
  }
  
  saveAppState();
  renderActivityTimeline();
}

// Theme Switcher Logic
function setupThemeToggle() {
  const body = document.body;
  const toggleBtn = document.getElementById("btn-theme-toggle");
  const toggleText = document.getElementById("theme-toggle-text");
  
  // Load saved theme
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    body.classList.add("light-theme");
    toggleText.innerText = "Modo Oscuro";
  }
  
  toggleBtn.addEventListener("click", () => {
    body.classList.toggle("light-theme");
    const isLight = body.classList.contains("light-theme");
    toggleText.innerText = isLight ? "Modo Oscuro" : "Modo Claro";
    localStorage.setItem("theme", isLight ? "light" : "dark");
    
    // Rerender charts to update gridline/font colors if necessary
    renderDashboardCharts();
  });
}

// Navigation Tabs Switcher
function setupNavigation() {
  const navItems = document.querySelectorAll(".sidebar .nav-item");
  const tabPanels = document.querySelectorAll(".tab-panel");
  const pageTitle = document.getElementById("page-title-header");
  const pageSubtitle = document.getElementById("page-subtitle-header");
  
  const headerTexts = {
    dashboard: { title: "Panel de Control", sub: "Resumen general y métricas operativas de la obra." },
    computos: { title: "Cómputos Métricos y Presupuesto", sub: "Control y valuaciones del presupuesto base frente a la ejecución real de obra." },
    materiales: { title: "Almacén y Materiales", sub: "Gestión de inventarios, niveles de reorden y requisiciones de materiales." },
    proveedores: { title: "Directorio de Proveedores", sub: "Administración de contratistas, proveedores de refrigeración y proveedores civiles." },
    pagos: { title: "Flujo de Aprobación de Pagos", sub: "Pipeline de pagos integrado desde la ingeniería de campo hasta la administración." },
    reportes: { title: "Reportes de Administración", sub: "Generador de reportes formatorios, valuaciones de obra oficiales e historial financiero." }
  };
  
  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const tabId = item.getAttribute("data-tab");
      
      // Update active nav item
      navItems.forEach(nav => nav.classList.remove("active"));
      item.classList.add("active");
      
      // Update active panel
      tabPanels.forEach(panel => panel.classList.remove("active"));
      document.getElementById(`${tabId}-tab`).classList.add("active");
      
      // Set Header Text
      if (headerTexts[tabId]) {
        pageTitle.innerText = headerTexts[tabId].title;
        pageSubtitle.innerText = headerTexts[tabId].sub;
      }
      
      // Special Rerenders
      if (tabId === "dashboard") {
        renderDashboard();
      } else if (tabId === "computos") {
        renderComputos();
      } else if (tabId === "materiales") {
        renderMaterials();
      } else if (tabId === "proveedores") {
        renderProviders();
      } else if (tabId === "pagos") {
        renderPayments();
      } else if (tabId === "reportes") {
        renderReports();
      }
    });
  });
}

// General Event Binding
function setupEventListeners() {
  // DB backups
  document.getElementById("btn-export-db").addEventListener("click", exportDatabase);
  document.getElementById("btn-import-db").addEventListener("click", () => {
    document.getElementById("file-db-input").click();
  });
  document.getElementById("file-db-input").addEventListener("change", importDatabase);
  
  // Chapter Modals
  document.getElementById("btn-add-chapter").addEventListener("click", () => openModal("modal-chapter"));
  document.getElementById("btn-save-chapter").addEventListener("click", saveChapter);
  
  // Partida Modals
  document.getElementById("btn-add-partida").addEventListener("click", () => {
    document.getElementById("partida-modal-title").innerText = "Registrar Nueva Partida";
    document.getElementById("partida-edit-id").value = "";
    document.getElementById("partida-executed-group").style.display = "none";
    populateChapterSelect();
    
    // Reset inputs
    document.getElementById("partida-code-input").value = "";
    document.getElementById("partida-unit-input").value = "";
    document.getElementById("partida-desc-input").value = "";
    document.getElementById("partida-qty-input").value = "";
    document.getElementById("partida-price-input").value = "";
    
    openModal("modal-partida");
  });
  document.getElementById("btn-save-partida").addEventListener("click", savePartida);
  
  // Material Modals
  document.getElementById("btn-add-material").addEventListener("click", () => {
    populateProviderSelect("mat-provider-select");
    openModal("modal-material");
  });
  document.getElementById("btn-save-material").addEventListener("click", saveMaterial);
  
  // Buy Material Modals
  document.getElementById("btn-request-material-buy").addEventListener("click", () => {
    populateMaterialSelect("buy-material-select");
    updateBuyMaterialDetails();
    openModal("modal-material-buy");
  });
  document.getElementById("buy-material-select").addEventListener("change", updateBuyMaterialDetails);
  document.getElementById("buy-qty-input").addEventListener("input", updateBuyMaterialDetails);
  document.getElementById("btn-execute-buy").addEventListener("click", executeMaterialBuy);
  
  // Provider Modals
  document.getElementById("btn-add-provider").addEventListener("click", () => openModal("modal-provider"));
  document.getElementById("btn-save-provider").addEventListener("click", saveProvider);
  
  // Payment Modals
  document.getElementById("btn-create-payment-req").addEventListener("click", () => {
    populateProviderSelect("pay-provider-select");
    
    // Clear inputs and previews
    document.getElementById("pay-title-input").value = "";
    document.getElementById("pay-amount-input").value = "";
    document.getElementById("pay-notes-input").value = "";
    document.getElementById("pay-invoice-file").value = "";
    document.getElementById("pay-bank-input").value = "";
    uploadedInvoiceBase64 = "";
    document.getElementById("pay-invoice-preview").src = "";
    document.getElementById("pay-invoice-preview-container").style.display = "none";
    
    triggerPaymentProviderAutofill();
    openModal("modal-payment");
  });
  document.getElementById("btn-save-payment").addEventListener("click", savePaymentRequest);
  
  // Search and filters
  document.getElementById("search-computos").addEventListener("input", renderComputos);
  document.getElementById("search-materials").addEventListener("input", renderMaterials);
  document.getElementById("filter-material-stock").addEventListener("change", renderMaterials);
  document.getElementById("search-providers").addEventListener("input", renderProviders);
  document.getElementById("search-payments").addEventListener("input", renderPayments);
  document.getElementById("filter-payment-category").addEventListener("change", renderPayments);
  
  // Reports panel setup
  document.getElementById("report-select-type").addEventListener("change", () => {
    const type = document.getElementById("report-select-type").value;
    const filterGroup = document.getElementById("report-prov-filter-group");
    if (type === "valuacion_general") {
      filterGroup.style.display = "none";
    } else {
      filterGroup.style.display = "flex";
      populateProviderSelect("report-select-provider", true);
    }
    renderReports();
  });
  document.getElementById("report-select-provider").addEventListener("change", renderReports);
  document.getElementById("btn-print-report").addEventListener("click", () => window.print());
  document.getElementById("btn-csv-report").addEventListener("click", exportReportToCSV);
  
  // Modal Close buttons
  document.querySelectorAll(".modal-close-btn, .modal-backdrop button[data-modal]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const modalId = btn.getAttribute("data-modal");
      closeModal(modalId);
    });
  });

  // Autocomplete bank details when provider changes
  document.getElementById("pay-provider-select").addEventListener("change", triggerPaymentProviderAutofill);

  // File Upload and Canvas Compression listener
  document.getElementById("pay-invoice-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        // Create canvas to downscale
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 650;
        const MAX_HEIGHT = 650;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to jpeg quality 0.7 to save localStorage space (~30-50KB)
        uploadedInvoiceBase64 = canvas.toDataURL("image/jpeg", 0.7);
        
        // Update UI preview
        document.getElementById("pay-invoice-preview").src = uploadedInvoiceBase64;
        document.getElementById("pay-invoice-preview-container").style.display = "block";
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Remove photo click listener
  document.getElementById("btn-remove-invoice-photo").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("pay-invoice-file").value = "";
    uploadedInvoiceBase64 = "";
    document.getElementById("pay-invoice-preview").src = "";
    document.getElementById("pay-invoice-preview-container").style.display = "none";
  });

  // Project settings & configuration triggers
  document.getElementById("btn-config-project").addEventListener("click", () => {
    document.getElementById("cfg-project-name").value = appState.projectName || "Mi Proyecto";
    document.getElementById("cfg-user-name").value = appState.userName || "Ing. Residente";
    document.getElementById("cfg-user-role").value = appState.userRole || "Director de Obra";
    
    const config = appState.telegramConfig || { enabled: false, token: "", chatId: "" };
    document.getElementById("tel-enabled-chk").checked = config.enabled;
    document.getElementById("tel-token-input").value = config.token || "";
    document.getElementById("tel-chatid-input").value = config.chatId || "";
    document.getElementById("telegram-test-status").innerText = "";
    openModal("modal-config");
  });
  
  document.getElementById("btn-save-config").addEventListener("click", () => {
    appState.projectName = document.getElementById("cfg-project-name").value.trim() || "Mi Proyecto";
    appState.userName = document.getElementById("cfg-user-name").value.trim() || "Ing. Residente";
    appState.userRole = document.getElementById("cfg-user-role").value.trim() || "Director de Obra";
    
    appState.telegramConfig = {
      enabled: document.getElementById("tel-enabled-chk").checked,
      token: document.getElementById("tel-token-input").value.trim(),
      chatId: document.getElementById("tel-chatid-input").value.trim()
    };
    
    saveAppState();
    updateProjectMetadataDOM();
    closeModal("modal-config");
    
    // Rerender charts and reports to reflect project name changes
    renderDashboardCharts();
    renderReports();
    
    logActivity("Configuración del proyecto y alertas actualizada.", "info");
  });

  document.getElementById("btn-reset-db").addEventListener("click", () => {
    const confirmReset = confirm("¿Estás seguro de que deseas restablecer por completo la base de datos?\nSe perderán todas las partidas, proveedores, materiales y registros de pagos.");
    if (confirmReset) {
      localStorage.removeItem("structura_db");
      window.location.reload();
    }
  });
  
  document.getElementById("btn-test-telegram").addEventListener("click", async () => {
    const statusLbl = document.getElementById("telegram-test-status");
    statusLbl.style.color = "var(--text-secondary)";
    statusLbl.innerText = "Enviando mensaje de prueba...";
    
    const tempConfig = {
      enabled: true,
      token: document.getElementById("tel-token-input").value.trim(),
      chatId: document.getElementById("tel-chatid-input").value.trim()
    };
    
    const msg = `🔔 *STRUCTURA - Control de Obra*\n` +
                `-----------------------------------------\n` +
                `¡Prueba de conexión exitosa! Su bot ya está enlazado a la obra *${appState.projectName}*.`;
                
    const success = await sendTelegramRawMessage(tempConfig.token, tempConfig.chatId, msg);
    if (success) {
      statusLbl.style.color = "var(--success)";
      statusLbl.innerText = "¡Mensaje enviado con éxito al chat!";
    } else {
      statusLbl.style.color = "var(--danger)";
      statusLbl.innerText = "Error. Verifique el token, el Chat ID y que el bot esté en el grupo.";
    }
  });
}

/* Modal utility functions */
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = "flex";
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = "none";
  }
}

/* Populating Modal Select dropdowns */
function populateChapterSelect() {
  const select = document.getElementById("partida-chapter-select");
  select.innerHTML = "";
  appState.chapters.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.innerText = c.name;
    select.appendChild(opt);
  });
}

function populateProviderSelect(selectId, includeAll = false) {
  const select = document.getElementById(selectId);
  select.innerHTML = "";
  
  if (includeAll) {
    const optAll = document.createElement("option");
    optAll.value = "all";
    optAll.innerText = "Todos los Proveedores";
    select.appendChild(optAll);
  }
  
  appState.providers.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.innerText = p.name;
    select.appendChild(opt);
  });
}

function populateMaterialSelect(selectId) {
  const select = document.getElementById(selectId);
  select.innerHTML = "";
  appState.materials.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.innerText = `${m.name} (${m.unit})`;
    select.appendChild(opt);
  });
}

/* DB backups Functions */
function exportDatabase() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href",     dataStr     );
  dlAnchorElem.setAttribute("download", "Structura_Obra_Backup.json");
  dlAnchorElem.click();
  logActivity("Base de datos respaldada como archivo JSON", "primary");
}

function importDatabase(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed.chapters && parsed.providers && parsed.materials && parsed.payments) {
        appState = parsed;
        saveAppState();
        renderDashboard();
        renderComputos();
        renderMaterials();
        renderProviders();
        renderPayments();
        renderReports();
        alert("¡Base de datos importada exitosamente!");
        logActivity("Base de datos importada exitosamente desde archivo JSON", "success");
      } else {
        alert("Archivo JSON no compatible con el formato de Structura.");
      }
    } catch (err) {
      alert("Error al procesar el archivo JSON.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

/* Math calculations helpers */
function getTotals() {
  let budgetTotal = 0;
  let executedTotal = 0;
  
  appState.chapters.forEach(c => {
    c.partidas.forEach(p => {
      budgetTotal += p.qtyBudget * p.priceUnit;
      executedTotal += p.qtyExecuted * p.priceUnit;
    });
  });
  
  let paidTotal = 0;
  let pendingTotal = 0;
  let pendingCount = 0;
  
  appState.payments.forEach(p => {
    if (p.status === "pagado") {
      paidTotal += p.amount;
    } else {
      pendingTotal += p.amount;
      pendingCount++;
    }
  });
  
  return {
    budgetTotal,
    executedTotal,
    progressPct: budgetTotal > 0 ? (executedTotal / budgetTotal) * 100 : 0,
    paidTotal,
    pendingTotal,
    pendingCount
  };
}

/* RENDER: DASHBOARD SECTION */
function renderDashboard() {
  const totals = getTotals();
  
  // Set KPIs text
  document.getElementById("kpi-total-budget").innerText = formatCurrency(totals.budgetTotal);
  document.getElementById("kpi-executed-budget").innerText = formatCurrency(totals.executedTotal);
  document.getElementById("kpi-progress-pct").innerText = totals.progressPct.toFixed(1) + "%";
  document.getElementById("kpi-paid-amount").innerText = formatCurrency(totals.paidTotal);
  
  const executionRatio = totals.executedTotal > 0 ? (totals.paidTotal / totals.executedTotal) * 100 : 0;
  document.getElementById("kpi-paid-ratio").innerText = `${executionRatio.toFixed(1)}% de lo ejecutado`;
  
  document.getElementById("kpi-pending-payments").innerText = formatCurrency(totals.pendingTotal);
  document.getElementById("kpi-pending-count").innerText = `${totals.pendingCount} solic.`;
  
  renderDashboardMaterialsAlerts();
  renderActivityTimeline();
  renderDashboardCharts();
}

function renderDashboardMaterialsAlerts() {
  const tbody = document.getElementById("dashboard-materials-list");
  const alertBadge = document.getElementById("alert-materials-count");
  tbody.innerHTML = "";
  
  // Filter materials with low stock
  const alerts = appState.materials.filter(m => m.stock <= m.minRequired);
  alertBadge.innerText = `${alerts.length} Alertas`;
  alertBadge.className = `material-stock-badge ${alerts.length > 0 ? 'critical' : 'ok'}`;
  
  if (alerts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No hay alertas críticas de materiales en inventario.</td></tr>`;
    return;
  }
  
  alerts.forEach(m => {
    const prov = appState.providers.find(p => p.id === m.providerId) || { name: "N/A" };
    const stockStatus = m.stock === 0 ? "Crítico" : "Reorden";
    const statusClass = m.stock === 0 ? "critical" : "warning";
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${m.name}</strong><br><span style="font-size: 0.75rem; color: var(--text-muted);">${prov.name}</span></td>
      <td>${m.stock} ${m.unit}</td>
      <td>${m.minRequired} ${m.unit}</td>
      <td><span class="material-stock-badge ${statusClass}">${stockStatus}</span></td>
      <td>
        <button class="btn btn-primary btn-sm btn-icon-only" title="Comprar Abastecimiento" onclick="openBuyMaterialFor('${m.id}')">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openBuyMaterialFor(matId) {
  const tabBtn = document.getElementById("nav-materiales");
  tabBtn.click();
  
  populateMaterialSelect("buy-material-select");
  document.getElementById("buy-material-select").value = matId;
  updateBuyMaterialDetails();
  openModal("modal-material-buy");
}

function renderActivityTimeline() {
  const container = document.getElementById("activity-timeline");
  container.innerHTML = "";
  
  if (appState.activities.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0;">No hay operaciones registradas aún.</p>`;
    return;
  }
  
  appState.activities.forEach(act => {
    const div = document.createElement("div");
    div.className = "activity-item";
    div.innerHTML = `
      <span class="activity-dot ${act.type}"></span>
      <div class="activity-details">
        <span class="activity-desc">${act.text}</span>
        <span class="activity-time">${act.time}</span>
      </div>
    `;
    container.appendChild(div);
  });
}

// Chart.js Configuration
function renderDashboardCharts() {
  const isLightTheme = document.body.classList.contains("light-theme");
  const textColor = isLightTheme ? "#0f172a" : "#94a3b8";
  const gridColor = isLightTheme ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.05)";
  
  // Data Extraction for Charts
  const labels = [];
  const budgetedData = [];
  const executedData = [];
  
  appState.chapters.forEach(c => {
    labels.push(c.name.length > 25 ? c.name.substring(0, 22) + "..." : c.name);
    let capBudget = 0;
    let capExecuted = 0;
    c.partidas.forEach(p => {
      capBudget += p.qtyBudget * p.priceUnit;
      capExecuted += p.qtyExecuted * p.priceUnit;
    });
    budgetedData.push(capBudget);
    executedData.push(capExecuted);
  });
  
  // 1. Budget Comparison (Bar Chart)
  const ctxBar = document.getElementById("chart-budget-comparison").getContext("2d");
  if (barChartInstance) barChartInstance.destroy();
  barChartInstance = new Chart(ctxBar, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Presupuestado ($)",
          data: budgetedData,
          backgroundColor: isLightTheme ? "#4f46e5" : "rgba(99, 102, 241, 0.85)",
          borderColor: "#6366f1",
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: "Ejecutado ($)",
          data: executedData,
          backgroundColor: isLightTheme ? "#10b981" : "rgba(16, 185, 129, 0.85)",
          borderColor: "#10b981",
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 10 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { 
            color: textColor,
            font: { family: 'Plus Jakarta Sans', size: 10 },
            callback: value => "$" + value.toLocaleString()
          }
        }
      },
      plugins: {
        legend: {
          labels: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } }
        }
      }
    }
  });

  // 2. Budget Distribution (Doughnut Chart)
  const ctxPie = document.getElementById("chart-budget-distribution").getContext("2d");
  if (pieChartInstance) pieChartInstance.destroy();
  
  const pieColors = ["#6366f1", "#10b981", "#f59e0b", "#0ea5e9", "#ec4899", "#8b5cf6"];
  
  pieChartInstance = new Chart(ctxPie, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        data: budgetedData,
        backgroundColor: pieColors.slice(0, labels.length),
        borderWidth: isLightTheme ? 2 : 0,
        borderColor: varToHex("--bg-surface")
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: {
        legend: {
          position: "right",
          labels: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 10 } }
        }
      }
    }
  });
}

function varToHex(cssVar) {
  return getComputedStyle(document.body).getPropertyValue(cssVar).trim();
}

/* RENDER: CÓMPUTOS MÉTRICOS & PRESUPUESTO */
function renderComputos() {
  const root = document.getElementById("chapters-accordion-root");
  const searchVal = document.getElementById("search-computos").value.toLowerCase();
  root.innerHTML = "";
  
  appState.chapters.forEach(c => {
    // Filter partidas inside chapter
    const filteredPartidas = c.partidas.filter(p => 
      p.code.toLowerCase().includes(searchVal) || 
      p.desc.toLowerCase().includes(searchVal)
    );
    
    // If search is active and chapter has no matching items, skip rendering this chapter
    if (searchVal && filteredPartidas.length === 0) return;
    
    // Calculate chapter sums
    let capBudget = 0;
    let capExecuted = 0;
    c.partidas.forEach(p => {
      capBudget += p.qtyBudget * p.priceUnit;
      capExecuted += p.qtyExecuted * p.priceUnit;
    });
    const capProgress = capBudget > 0 ? (capExecuted / capBudget) * 100 : 0;
    
    const chapterDiv = document.createElement("div");
    chapterDiv.className = "chapter-container";
    chapterDiv.id = `chapter-card-${c.id}`;
    
    // Chapter Header Accordion
    chapterDiv.innerHTML = `
      <div class="chapter-header-bar" onclick="toggleChapter('${c.id}')">
        <div class="chapter-title-group">
          <svg class="chapter-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
          <h4 class="chapter-title">${c.name}</h4>
          <span class="chapter-badge">${c.partidas.length} Partidas</span>
          <button class="btn-delete-chapter-trash" title="Eliminar Capítulo" onclick="deleteChapter(event, '${c.id}')" style="background: none; border: none; color: var(--danger); opacity: 0.7; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0.25rem; border-radius: 4px; transition: all 0.2s;" onmouseover="this.style.opacity=1; this.style.background='rgba(239, 68, 68, 0.1)'" onmouseout="this.style.opacity=0.7; this.style.background='none'">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
        <div class="chapter-summary">
          <div class="chapter-stats-block">
            <span class="chapter-stats-label">Presupuesto</span>
            <span class="chapter-stats-value">${formatCurrency(capBudget)}</span>
          </div>
          <div class="chapter-stats-block">
            <span class="chapter-stats-label">Ejecutado (${capProgress.toFixed(0)}%)</span>
            <span class="chapter-stats-value" style="color: var(--success);">${formatCurrency(capExecuted)}</span>
          </div>
        </div>
      </div>
      <div class="chapter-body-content">
        <div class="table-responsive">
          <table class="table-computos">
            <thead>
              <tr>
                <th style="width: 80px;">Partida</th>
                <th>Descripción de Trabajos</th>
                <th style="width: 60px;">Und</th>
                <th style="text-align: right; width: 100px;">P. Unitario</th>
                <th style="text-align: right; width: 110px;">Cant. Presup.</th>
                <th style="text-align: right; width: 120px;">Monto Presup.</th>
                <th style="text-align: right; width: 110px;">Cant. Ejecut.</th>
                <th style="text-align: center; width: 140px;">% Avance</th>
                <th style="text-align: right; width: 120px;">Monto Ejecut.</th>
                <th style="width: 140px;">Acciones</th>
              </tr>
            </thead>
            <tbody id="chapter-tbody-${c.id}">
              <!-- Partidas generated by JS -->
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    root.appendChild(chapterDiv);
    
    // Fill partidas
    const tbody = document.getElementById(`chapter-tbody-${c.id}`);
    filteredPartidas.forEach(p => {
      const pBudget = p.qtyBudget * p.priceUnit;
      const pExecuted = p.qtyExecuted * p.priceUnit;
      const pProgress = p.qtyBudget > 0 ? (p.qtyExecuted / p.qtyBudget) * 100 : 0;
      
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><span class="partida-code">${p.code}</span></td>
        <td>${p.desc}</td>
        <td><span style="font-weight: 600; color: var(--text-secondary);">${p.unit}</span></td>
        <td style="text-align: right; font-weight: 500;">${formatCurrency(p.priceUnit)}</td>
        <td style="text-align: right; font-weight: 500;">${p.qtyBudget.toFixed(2)}</td>
        <td style="text-align: right; font-weight: 600;">${formatCurrency(pBudget)}</td>
        <td style="text-align: right;">
          <input type="number" step="0.01" class="valoration-input" value="${p.qtyExecuted.toFixed(2)}" 
                 onchange="updatePartidaExecution('${c.id}', '${p.id}', this.value)">
        </td>
        <td>
          <div class="progress-cell-wrapper">
            <div class="progress-text-row">
              <span>${p.qtyExecuted.toFixed(1)} / ${p.qtyBudget.toFixed(1)}</span>
              <span>${pProgress.toFixed(0)}%</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar-fill ${pProgress >= 100 ? 'success' : ''}" style="width: ${Math.min(pProgress, 100)}%;"></div>
            </div>
          </div>
        </td>
        <td style="text-align: right; font-weight: 600; color: var(--success);">${formatCurrency(pExecuted)}</td>
        <td>
          <div class="actions-cell">
            <button class="btn btn-secondary btn-sm btn-icon-only" title="Editar Partida" onclick="openEditPartida('${c.id}', '${p.id}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn btn-primary btn-sm btn-icon-only" title="Valuar Avance y Solicitar Pago" onclick="generatePaymentFromPartida('${p.id}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </button>
            <button class="btn btn-danger btn-sm btn-icon-only" title="Eliminar Partida" onclick="deletePartida('${c.id}', '${p.id}')" style="background-color: var(--danger); border-color: var(--danger);">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });
}

function toggleChapter(id) {
  const div = document.getElementById(`chapter-card-${id}`);
  if (div) {
    div.classList.toggle("collapsed");
  }
}

// Inline update of quantity executed
function updatePartidaExecution(chapId, partId, value) {
  const floatVal = parseFloat(value);
  if (isNaN(floatVal) || floatVal < 0) {
    alert("Por favor ingrese un número válido mayor o igual a 0.");
    renderComputos();
    return;
  }
  
  const chap = appState.chapters.find(c => c.id === chapId);
  const part = chap.partidas.find(p => p.id === partId);
  
  const oldVal = part.qtyExecuted;
  part.qtyExecuted = floatVal;
  saveAppState();
  
  // Update dashboard and accordion values immediately
  const difference = (floatVal - oldVal) * part.priceUnit;
  if (Math.abs(difference) > 0.01) {
    logActivity(`Partida ${part.code}: Avance actualizado a ${floatVal} ${part.unit} (Cambio: ${formatCurrency(difference)})`, "info");
  }
  
  // Re-render
  renderComputos();
  renderDashboard();
}

function openEditPartida(chapId, partId) {
  const chap = appState.chapters.find(c => c.id === chapId);
  const part = chap.partidas.find(p => p.id === partId);
  
  document.getElementById("partida-modal-title").innerText = "Editar Datos de Partida";
  document.getElementById("partida-edit-id").value = `${chapId}|${partId}`;
  
  populateChapterSelect();
  document.getElementById("partida-chapter-select").value = chapId;
  
  document.getElementById("partida-code-input").value = part.code;
  document.getElementById("partida-unit-input").value = part.unit;
  document.getElementById("partida-desc-input").value = part.desc;
  document.getElementById("partida-qty-input").value = part.qtyBudget;
  document.getElementById("partida-price-input").value = part.priceUnit;
  
  // Show executed field only on edit
  document.getElementById("partida-executed-group").style.display = "block";
  document.getElementById("partida-executed-input").value = part.qtyExecuted;
  
  openModal("modal-partida");
}

function savePartida() {
  const editId = document.getElementById("partida-edit-id").value;
  const targetChapterId = document.getElementById("partida-chapter-select").value;
  const code = document.getElementById("partida-code-input").value.trim();
  const unit = document.getElementById("partida-unit-input").value.trim();
  const desc = document.getElementById("partida-desc-input").value.trim();
  const qty = parseFloat(document.getElementById("partida-qty-input").value);
  const price = parseFloat(document.getElementById("partida-price-input").value);
  
  if (!code || !unit || !desc || isNaN(qty) || isNaN(price)) {
    alert("Por favor complete todos los campos con valores correctos.");
    return;
  }
  
  if (editId) {
    // Edit existing partida
    const [oldChapId, oldPartId] = editId.split("|");
    const oldChap = appState.chapters.find(c => c.id === oldChapId);
    
    // Find index and remove from old chapter if chapter changed
    const partIndex = oldChap.partidas.findIndex(p => p.id === oldPartId);
    const existingPart = oldChap.partidas[partIndex];
    
    const executed = parseFloat(document.getElementById("partida-executed-input").value) || 0;
    
    existingPart.code = code;
    existingPart.unit = unit;
    existingPart.desc = desc;
    existingPart.qtyBudget = qty;
    existingPart.priceUnit = price;
    existingPart.qtyExecuted = executed;
    
    if (oldChapId !== targetChapterId) {
      // Remove from old
      oldChap.partidas.splice(partIndex, 1);
      // Add to new
      const newChap = appState.chapters.find(c => c.id === targetChapterId);
      newChap.partidas.push(existingPart);
    }
    
    logActivity(`Partida ${code} modificada: Presupuesto actualizado a ${formatCurrency(qty * price)}`, "info");
  } else {
    // Add new partida
    const newPartida = {
      id: "P-" + Date.now(),
      code,
      desc,
      unit,
      qtyBudget: qty,
      priceUnit: price,
      qtyExecuted: 0
    };
    
    const targetChap = appState.chapters.find(c => c.id === targetChapterId);
    targetChap.partidas.push(newPartida);
    
    logActivity(`Nueva partida registrada: [${code}] en el capítulo ${targetChap.name}`, "success");
  }
  
  saveAppState();
  closeModal("modal-partida");
  renderComputos();
  renderDashboard();
}

function saveChapter() {
  const name = document.getElementById("chapter-name-input").value.trim();
  if (!name) {
    alert("Por favor ingrese el nombre del capítulo.");
    return;
  }
  
  const newChapter = {
    id: "C-" + Date.now(),
    name,
    partidas: []
  };
  
  appState.chapters.push(newChapter);
  saveAppState();
  closeModal("modal-chapter");
  renderComputos();
  
  logActivity(`Nuevo capítulo registrado: ${name}`, "success");
}

// Auto-valuation helper: generate payment request for the work executed on a partida
function generatePaymentFromPartida(partId) {
  // Find partida
  let foundPart = null;
  appState.chapters.forEach(c => {
    const p = c.partidas.find(part => part.id === partId);
    if (p) foundPart = p;
  });
  
  if (!foundPart) return;
  
  const totalExecutedValue = foundPart.qtyExecuted * foundPart.priceUnit;
  if (totalExecutedValue <= 0) {
    alert("Esta partida tiene 0.00 de avance físico. Para generar un cobro, primero aumente la Cantidad Ejecutada en la tabla.");
    return;
  }
  
  // Check how much has already been requested or paid for this partida provider
  // For demo, we'll offer to pay the outstanding executed value
  const concept = `Valuación de Obra - Partida [${foundPart.code}] (${foundPart.qtyExecuted} ${foundPart.unit})`;
  
  populateProviderSelect("pay-provider-select");
  
  // Seed the modal
  document.getElementById("pay-title-input").value = concept;
  document.getElementById("pay-category-select").value = "valuacion";
  document.getElementById("pay-amount-input").value = totalExecutedValue.toFixed(2);
  document.getElementById("pay-notes-input").value = `Medición física en obra: ${foundPart.qtyExecuted} de ${foundPart.qtyBudget} ${foundPart.unit} presupuestado.`;
  
  // Auto-select provider of construction civil materials as a fallback
  document.getElementById("pay-provider-select").value = "P-03"; // Agregados Miranda (civil)
  triggerPaymentProviderAutofill();
  
  // Switch tab visually
  const tabBtn = document.getElementById("nav-pagos");
  tabBtn.click();
  
  openModal("modal-payment");
}

/* RENDER: MATERIALES SECTION */
function renderMaterials() {
  const grid = document.getElementById("materials-cards-grid");
  const searchVal = document.getElementById("search-materials").value.toLowerCase();
  const stockFilter = document.getElementById("filter-material-stock").value;
  grid.innerHTML = "";
  
  const filtered = appState.materials.filter(m => {
    const prov = appState.providers.find(p => p.id === m.providerId) || { name: "" };
    const matchesSearch = m.name.toLowerCase().includes(searchVal) || prov.name.toLowerCase().includes(searchVal);
    
    let matchesStock = true;
    const isCritical = m.stock === 0;
    const isWarning = m.stock > 0 && m.stock <= m.minRequired;
    const isOk = m.stock > m.minRequired;
    
    if (stockFilter === "critical") matchesStock = isCritical;
    else if (stockFilter === "warning") matchesStock = isWarning;
    else if (stockFilter === "ok") matchesStock = isOk;
    
    return matchesSearch && matchesStock;
  });
  
  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">No se encontraron materiales con los filtros seleccionados.</div>`;
    return;
  }
  
  filtered.forEach(m => {
    const prov = appState.providers.find(p => p.id === m.providerId) || { name: "Sin Proveedor" };
    
    let statusLabel = "Stock Óptimo";
    let statusClass = "ok";
    let pct = (m.stock / (m.minRequired * 2)) * 100; // Reference full scale as 2x minimum
    pct = Math.min(Math.max(pct, 0), 100);
    
    if (m.stock === 0) {
      statusLabel = "Sin Existencias";
      statusClass = "critical";
    } else if (m.stock <= m.minRequired) {
      statusLabel = "Reorden Req.";
      statusClass = "warning";
    }
    
    const card = document.createElement("div");
    card.className = "material-card";
    card.innerHTML = `
      <div class="material-header-row">
        <div class="material-name">${m.name}</div>
        <span class="material-stock-badge ${statusClass}">${statusLabel}</span>
      </div>
      
      <div class="material-details-grid">
        <div class="material-detail-item">
          <span class="material-detail-label">Stock en Obra</span>
          <span class="material-detail-value" style="font-size: 1.15rem; color: var(--text-primary);">${m.stock} ${m.unit}</span>
        </div>
        <div class="material-detail-item">
          <span class="material-detail-label">Mínimo Req.</span>
          <span class="material-detail-value">${m.minRequired} ${m.unit}</span>
        </div>
        <div class="material-detail-item">
          <span class="material-detail-label">Costo Unitario</span>
          <span class="material-detail-value">${formatCurrency(m.priceUnit)}</span>
        </div>
        <div class="material-detail-item">
          <span class="material-detail-label">Valor Almacén</span>
          <span class="material-detail-value" style="color: var(--success);">${formatCurrency(m.stock * m.priceUnit)}</span>
        </div>
      </div>
      
      <div class="material-detail-item" style="gap: 0.35rem;">
        <span class="material-detail-label">Indicador de Almacén</span>
        <div class="material-fuel-gauge">
          <div class="material-fuel-fill ${statusClass}" style="width: ${pct}%;"></div>
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.85rem; margin-top: 0.25rem;">
        <span style="font-size: 0.75rem; color: var(--text-secondary); max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          <strong>Prov:</strong> ${prov.name}
        </span>
        <div style="display: flex; gap: 0.25rem;">
          <button class="btn btn-danger btn-sm btn-icon-only" title="Eliminar Material" onclick="deleteMaterial('${m.id}')" style="background-color: var(--danger); border-color: var(--danger); padding: 0.25rem; height: 26px; width: 26px; display: flex; align-items: center; justify-content: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
          <button class="btn btn-secondary btn-sm" onclick="openBuyMaterialFor('${m.id}')" style="font-size: 0.75rem; padding: 0.25rem 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7V2.5A2.5 2.5 0 0 1 14.5 5h0A2.5 2.5 0 0 1 12 7z"></path></svg>
            Surtir
          </button>
        </div>
      </div>
    `;
    
    grid.appendChild(card);
  });
}

function saveMaterial() {
  const name = document.getElementById("mat-name-input").value.trim();
  const unit = document.getElementById("mat-unit-input").value.trim();
  const price = parseFloat(document.getElementById("mat-price-input").value);
  const stock = parseFloat(document.getElementById("mat-stock-input").value);
  const min = parseFloat(document.getElementById("mat-min-input").value);
  const providerId = document.getElementById("mat-provider-select").value;
  
  if (!name || !unit || isNaN(price) || isNaN(stock) || isNaN(min)) {
    alert("Por favor complete todos los campos correctamente.");
    return;
  }
  
  const newMaterial = {
    id: "M-" + Date.now(),
    name,
    unit,
    priceUnit: price,
    stock,
    minRequired: min,
    providerId
  };
  
  appState.materials.push(newMaterial);
  saveAppState();
  closeModal("modal-material");
  renderMaterials();
  
  logActivity(`Material registrado: ${name} (Stock: ${stock} ${unit})`, "success");
}

/* Material replenishment order functions */
function updateBuyMaterialDetails() {
  const matId = document.getElementById("buy-material-select").value;
  if (!matId) return;
  
  const m = appState.materials.find(mat => mat.id === matId);
  const prov = appState.providers.find(p => p.id === m.providerId) || { name: "N/A" };
  const qty = parseFloat(document.getElementById("buy-qty-input").value) || 0;
  
  document.getElementById("buy-price-display").value = formatCurrency(m.priceUnit);
  document.getElementById("buy-total-display").value = formatCurrency(qty * m.priceUnit);
  document.getElementById("buy-provider-display").value = prov.name;
}

function executeMaterialBuy() {
  const matId = document.getElementById("buy-material-select").value;
  const qty = parseFloat(document.getElementById("buy-qty-input").value);
  const createPayment = document.getElementById("buy-create-payment-chk").checked;
  
  if (isNaN(qty) || qty <= 0) {
    alert("Ingrese una cantidad de compra válida mayor a 0.");
    return;
  }
  
  const m = appState.materials.find(mat => mat.id === matId);
  const prov = appState.providers.find(p => p.id === m.providerId) || { name: "N/A", id: "P-03" };
  const purchaseCost = qty * m.priceUnit;
  
  // Increase stock in warehouse
  m.stock += qty;
  
  // Log activity
  logActivity(`Almacén: Surtido ${qty} ${m.unit} de ${m.name} (Costo total: ${formatCurrency(purchaseCost)})`, "success");
  
  // Create Payment request if checkbox checked
  if (createPayment) {
    const paymentReq = {
      id: "PAY-" + Date.now(),
      title: `Adquisición de Material - ${qty} ${m.unit} de ${m.name}`,
      amount: purchaseCost,
      category: "material",
      providerId: prov.id,
      status: "pendiente",
      date: new Date().toISOString().split('T')[0],
      notes: "Generado automáticamente por orden de reabastecimiento en almacén.",
      ref: "",
      datePaid: ""
    };
    appState.payments.push(paymentReq);
    logActivity(`Pago registrado: Cuenta por pagar de ${formatCurrency(purchaseCost)} generada para ${prov.name}`, "warning");
  }
  
  saveAppState();
  closeModal("modal-material-buy");
  renderMaterials();
  renderDashboard();
}

/* RENDER: PROVEEDORES SECTION */
function renderProviders() {
  const grid = document.getElementById("providers-cards-grid");
  const searchVal = document.getElementById("search-providers").value.toLowerCase();
  grid.innerHTML = "";
  
  const filtered = appState.providers.filter(p => 
    p.name.toLowerCase().includes(searchVal) || 
    p.rif.toLowerCase().includes(searchVal) || 
    p.category.toLowerCase().includes(searchVal)
  );
  
  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">No se encontraron proveedores registrados.</div>`;
    return;
  }
  
  filtered.forEach(p => {
    // Calculate balances for provider
    let paidTotal = 0;
    let pendingTotal = 0;
    appState.payments.forEach(pay => {
      if (pay.providerId === p.id) {
        if (pay.status === "pagado") paidTotal += pay.amount;
        else pendingTotal += pay.amount;
      }
    });
    
    const card = document.createElement("div");
    card.className = "provider-card";
    
    // Vendor rating stars
    const ratingStars = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> <span>${p.rating}</span>`;
    
    card.innerHTML = `
      <div class="provider-header">
        <div class="provider-logo-circle">${p.name.substring(0,2).toUpperCase()}</div>
        <div class="provider-name-block">
          <div class="provider-company-name">${p.name}</div>
          <div class="provider-rif">${p.rif}</div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.35rem;">
          <div class="provider-rating">
            ${ratingStars}
          </div>
          <button class="btn btn-danger btn-sm btn-icon-only" title="Eliminar Proveedor" onclick="deleteProvider('${p.id}')" style="background-color: var(--danger); border-color: var(--danger); padding: 0.15rem; height: 22px; width: 22px; display: flex; align-items: center; justify-content: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
      
      <ul class="provider-info-list">
        <li class="provider-info-item">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
          <span><strong>Especialidad:</strong> ${p.category}</span>
        </li>
        <li class="provider-info-item">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          <span>${p.phone}</span>
        </li>
        <li class="provider-info-item">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          <span style="font-size:0.75rem; word-break: break-all;">${p.email}</span>
        </li>
      </ul>
      
      <div class="provider-stats-split">
        <div class="material-detail-item">
          <span class="material-detail-label">Cobrado</span>
          <span class="material-detail-value" style="color: var(--success);">${formatCurrency(paidTotal)}</span>
        </div>
        <div class="material-detail-item" style="border-left: 1px solid var(--border-color); padding-left: 0.75rem;">
          <span class="material-detail-label">Por Cobrar</span>
          <span class="material-detail-value" style="color: var(--warning);">${formatCurrency(pendingTotal)}</span>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function saveProvider() {
  const name = document.getElementById("prov-name-input").value.trim();
  const rif = document.getElementById("prov-rif-input").value.trim();
  const category = document.getElementById("prov-category-input").value.trim();
  const phone = document.getElementById("prov-phone-input").value.trim();
  const email = document.getElementById("prov-email-input").value.trim();
  const address = document.getElementById("prov-address-input").value.trim();
  const bank = document.getElementById("prov-bank-input").value.trim();
  
  if (!name || !rif || !category) {
    alert("Por favor complete nombre, RIF y categoría del proveedor.");
    return;
  }
  
  const newProvider = {
    id: "P-" + Date.now(),
    name,
    rif,
    category,
    phone: phone || "N/A",
    email: email || "N/A",
    address: address || "N/A",
    bankDetails: bank || "",
    rating: 5.0
  };
  
  appState.providers.push(newProvider);
  saveAppState();
  closeModal("modal-provider");
  renderProviders();
  
  logActivity(`Proveedor registrado: ${name} (${category})`, "success");
}

/* RENDER: FLUJO DE PAGOS SECTION (KANBAN PIPELINE) */
function renderPayments() {
  const columns = {
    pendiente: document.getElementById("container-pendiente"),
    aprobado: document.getElementById("container-aprobado"),
    autorizado: document.getElementById("container-autorizado"),
    pagado: document.getElementById("container-pagado")
  };
  
  const searchVal = document.getElementById("search-payments").value.toLowerCase();
  const catFilter = document.getElementById("filter-payment-category").value;
  
  // Clear columns
  for (let key in columns) {
    if (columns[key]) columns[key].innerHTML = "";
  }
  
  const counters = { pendiente: 0, aprobado: 0, autorizado: 0, pagado: 0 };
  
  // Filter payments
  const filtered = appState.payments.filter(p => {
    const prov = appState.providers.find(prov => prov.id === p.providerId) || { name: "" };
    const matchesSearch = p.title.toLowerCase().includes(searchVal) || prov.name.toLowerCase().includes(searchVal);
    const matchesCat = catFilter === "all" || p.category === catFilter;
    return matchesSearch && matchesCat;
  });
  
  filtered.forEach(p => {
    const colContainer = columns[p.status];
    if (!colContainer) return;
    
    counters[p.status]++;
    const prov = appState.providers.find(prov => prov.id === p.providerId) || { name: "Contratista N/A" };
    
    let stampHtml = "";
    if (p.status === "aprobado") {
      stampHtml = `<div class="digital-stamp eng-ok">VAL. ING OK</div>`;
    } else if (p.status === "autorizado") {
      stampHtml = `<div class="digital-stamp auth-ok">AUTORIZADO</div>`;
    } else if (p.status === "pagado") {
      stampHtml = `<div class="digital-stamp paid-ok">PAGADO</div>`;
    } else {
      stampHtml = `<div class="digital-stamp val-ok" style="border-style: dotted;">PRE-MEDICION</div>`;
    }
    
    // Category label mapper
    const catLabel = p.category === "valuacion" ? "Valuación" : p.category === "material" ? "Materiales" : "Servicios/Equip.";
    
    // Control buttons inside card to move status easily without dragging
    let moveButtonsHtml = "";
    if (p.status === "pendiente") {
      moveButtonsHtml = `<button class="btn btn-secondary btn-sm" style="flex-grow: 1; font-size: 0.7rem; padding: 0.25rem 0.5rem;" onclick="advancePaymentStatus('${p.id}', 'aprobado')">Aprobar Ingeniería →</button>`;
    } else if (p.status === "aprobado") {
      moveButtonsHtml = `<button class="btn btn-success btn-sm" style="flex-grow: 1; font-size: 0.7rem; padding: 0.25rem 0.5rem;" onclick="advancePaymentStatus('${p.id}', 'autorizado')">Autorizar Caja →</button>`;
    } else if (p.status === "autorizado") {
      moveButtonsHtml = `<button class="btn btn-primary btn-sm" style="flex-grow: 1; font-size: 0.7rem; padding: 0.25rem 0.5rem;" onclick="promptMarkPaid('${p.id}')">Marcar Pagado ✓</button>`;
    } else if (p.status === "pagado") {
      moveButtonsHtml = `<span style="font-size: 0.75rem; color: var(--text-muted); flex-grow: 1;">Ref: ${p.ref || 'N/A'}</span>`;
    }
    
    const card = document.createElement("div");
    card.className = "payment-card";
    card.id = `card-${p.id}`;
    card.draggable = p.status !== "pagado"; // Disable drag once paid
    card.setAttribute("ondragstart", `drag(event, '${p.id}')`);
    
    let attachmentHtml = "";
    if (p.invoiceImage) {
      attachmentHtml = `
        <div class="payment-card-attachments">
          <span class="attachment-badge" onclick="viewPaymentInvoice('${p.id}', event)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
            Soporte / Factura
          </span>
        </div>
      `;
    }
    
    card.innerHTML = `
      <div class="payment-card-header">
        <span class="payment-card-category ${p.category}">${catLabel}</span>
        <span class="payment-card-amount">${formatCurrency(p.amount)}</span>
      </div>
      
      <div class="payment-card-title">${p.title}</div>
      
      <div class="payment-card-provider">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        <span>${prov.name}</span>
      </div>
      
      ${attachmentHtml}
      
      <div class="payment-card-footer" style="${p.invoiceImage ? 'border-top: 1px dashed var(--border-color); padding-top: 0.5rem; margin-top: 0.25rem;' : ''}">
        <span class="payment-card-date">${p.date}</span>
        ${stampHtml}
      </div>
      
      <div style="margin-top: 0.5rem; border-top: 1px dashed var(--border-color); padding-top: 0.5rem; display: flex; gap: 0.35rem; align-items: center;">
        ${moveButtonsHtml}
        <button class="btn btn-danger btn-sm btn-icon-only" title="Eliminar Solicitud" onclick="deletePaymentRequest('${p.id}')" style="background-color: var(--danger); border-color: var(--danger); padding: 0.25rem; height: 26px; width: 26px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    `;
    colContainer.appendChild(card);
  });
  
  // Set counters
  for (let key in counters) {
    const label = document.getElementById(`counter-${key}`);
    if (label) label.innerText = counters[key];
  }
}

// Kanban drag and drop hooks
function drag(ev, paymentId) {
  ev.dataTransfer.setData("text", paymentId);
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drop(ev, status) {
  ev.preventDefault();
  const paymentId = ev.dataTransfer.getData("text");
  
  if (status === "pagado") {
    promptMarkPaid(paymentId);
  } else {
    advancePaymentStatus(paymentId, status);
  }
}

function advancePaymentStatus(id, newStatus) {
  const p = appState.payments.find(pay => pay.id === id);
  if (!p) return;
  
  const oldStatus = p.status;
  
  // Disallow backwards moving unless needed, or allow freely for admin
  p.status = newStatus;
  saveAppState();
  
  const statusTexts = {
    pendiente: "Pre-Valuación",
    aprobado: "Aprobado por Ingeniería",
    autorizado: "Listo para Caja (Autorizado)",
    pagado: "Pagado"
  };
  
  logActivity(`Flujo de Pago: ${p.title} movido a [${statusTexts[newStatus]}]`, "info");
  
  // Trigger Telegram alert when payment is approved by engineering (moved from Pendiente Valuación)
  if (newStatus === "aprobado") {
    const prov = appState.providers.find(prov => prov.id === p.providerId) || { name: "Contratista N/A" };
    const text = `📢 *STRUCTURA: Valuación Aprobada por Ingeniería*\n` +
                 `---------------------------------------\n` +
                 `🚧 *Obra:* ${appState.projectName || 'Mi Proyecto'}\n` +
                 `👷 *Estatus:* Aprobado por Ingeniería de Campo\n` +
                 `📦 *Concepto:* ${p.title}\n` +
                 `🤝 *Proveedor:* ${prov.name}\n` +
                 `💰 *Monto:* ${formatCurrency(p.amount)}\n` +
                 `📄 *Soporte:* ${p.notes || 'Medición física en obra'}\n\n` +
                 `📌 _Esta valuación ha sido certificada en campo y está lista para revisión de presupuesto/caja._`;
    sendTelegramNotification(text);
  }
  
  // Trigger Telegram alert when payment goes to authorized (Listo para caja)
  if (newStatus === "autorizado") {
    const prov = appState.providers.find(prov => prov.id === p.providerId) || { name: "Contratista N/A" };
    const bankDetailsText = p.bankDetails ? `\`\`\`\n${p.bankDetails}\n\`\`\`` : "_No registrados_";
    const text = `📢 *STRUCTURA: Pago Autorizado para Caja*\n` +
                 `---------------------------------------\n` +
                 `🚧 *Obra:* ${appState.projectName || 'Mi Proyecto'}\n` +
                 `👷 *Emisor:* Ing. Residente de Obra\n` +
                 `📦 *Concepto:* ${p.title}\n` +
                 `🤝 *Proveedor:* ${prov.name}\n` +
                 `💰 *Monto:* ${formatCurrency(p.amount)}\n` +
                 `📄 *Soporte:* ${p.notes || 'Medición física en obra'}\n` +
                 `💳 *Datos Bancarios:*\n${bankDetailsText}\n\n` +
                 `📌 _Administración: Por favor proceda a liberar los fondos para este contratista._`;
    sendTelegramNotification(text);
  }
  
  renderPayments();
  renderDashboard();
}

// Prompt for transaction reference number when payment is completed
function promptMarkPaid(paymentId) {
  const p = appState.payments.find(pay => pay.id === paymentId);
  if (!p) return;
  
  const ref = prompt(`Marcar pago completado por: ${formatCurrency(p.amount)}\nIngrese Nro. Referencia Bancaria o Transferencia:`, `TRANS-${Math.floor(100000 + Math.random() * 900000)}`);
  
  if (ref === null) return; // User cancelled
  
  p.status = "pagado";
  p.ref = ref || `TRANS-MANUAL`;
  p.datePaid = new Date().toISOString().split('T')[0];
  
  saveAppState();
  logActivity(`Pago Procesado: ${p.title} pagado con Ref: ${p.ref} (${formatCurrency(p.amount)})`, "success");
  
  // Trigger Telegram alert when payment is marked as paid
  const prov = appState.providers.find(prov => prov.id === p.providerId) || { name: "Contratista N/A" };
  const text = `✅ *STRUCTURA: Pago Procesado exitosamente*\n` +
               `---------------------------------------\n` +
               `🚧 *Obra:* ${appState.projectName || 'Mi Proyecto'}\n` +
               `📦 *Concepto:* ${p.title}\n` +
               `🤝 *Proveedor:* ${prov.name}\n` +
               `💰 *Monto:* ${formatCurrency(p.amount)}\n` +
               `💳 *Ref. Bancaria:* ${p.ref}\n` +
               `📅 *Fecha Pago:* ${p.datePaid}\n\n` +
               `💼 _El pago ha sido registrado en el histórico contable de la obra._`;
  sendTelegramNotification(text);
  
  renderPayments();
  renderDashboard();
}

function savePaymentRequest() {
  const title = document.getElementById("pay-title-input").value.trim();
  const category = document.getElementById("pay-category-select").value;
  const amount = parseFloat(document.getElementById("pay-amount-input").value);
  const providerId = document.getElementById("pay-provider-select").value;
  const bankDetails = document.getElementById("pay-bank-input").value.trim();
  const notes = document.getElementById("pay-notes-input").value.trim();
  
  if (!title || isNaN(amount) || amount <= 0) {
    alert("Por favor complete los campos y asigne un monto válido mayor a 0.");
    return;
  }
  
  const newPayment = {
    id: "PAY-" + Date.now(),
    title,
    amount,
    category,
    providerId,
    status: "pendiente",
    date: new Date().toISOString().split('T')[0],
    notes: notes || "Soporte no adjunto",
    bankDetails: bankDetails,
    invoiceImage: uploadedInvoiceBase64 || "",
    ref: "",
    datePaid: ""
  };
  
  appState.payments.push(newPayment);
  saveAppState();
  
  // Clean up upload variable
  uploadedInvoiceBase64 = "";
  
  closeModal("modal-payment");
  renderPayments();
  renderDashboard();
  
  const prov = appState.providers.find(p => p.id === providerId) || { name: "N/A" };
  logActivity(`Nueva solicitud de pago registrada: ${title} por ${formatCurrency(amount)} para ${prov.name}`, "warning");
}

/* RENDER: REPORTES DE ADMINISTRACIÓN (PRINT & CSV) */
function renderReports() {
  const reportType = document.getElementById("report-select-type").value;
  const providerFilter = document.getElementById("report-select-provider").value;
  const table = document.getElementById("report-dynamic-table");
  const title = document.getElementById("report-doc-title-text");
  
  // Date configuration
  const now = new Date();
  document.getElementById("report-doc-date").innerText = now.getDate() + "/" + (now.getMonth() + 1) + "/" + now.getFullYear();
  document.getElementById("report-doc-number").innerText = "VAL-0" + (Math.floor(Math.random() * 40) + 10);
  
  // Dynamic report header values
  const repCompany = document.getElementById("report-company-name");
  if (repCompany) repCompany.innerText = "STRUCTURA - Control de Obra";
  const repProj = document.getElementById("report-project-name");
  if (repProj) repProj.innerText = `Proyecto: ${appState.projectName || 'Mi Proyecto'}`;
  const repUser = document.getElementById("report-user-name");
  if (repUser) repUser.innerText = `Responsable: ${appState.userName || 'Ing. Residente'} (${appState.userRole || 'Director de Obra'})`;

  // Signatures stamps simulation SVGs
  const stampEng = document.getElementById("report-sig-stamp-engineer");
  const stampMng = document.getElementById("report-sig-stamp-manager");
  const stampAdm = document.getElementById("report-sig-stamp-admin");
  
  // Custom stamps visuals
  stampEng.innerHTML = `<svg width="80" height="50" style="opacity: 0.65; transform: rotate(-5deg); color: #0284c7;"><rect x="5" y="5" width="70" height="40" rx="3" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3,3"/><text x="40" y="22" font-size="9" text-anchor="middle" fill="currentColor" font-weight="bold">INGENIERÍA</text><text x="40" y="34" font-size="7" text-anchor="middle" fill="currentColor">APROBADO</text></svg>`;
  
  const stampProjectName = (appState.projectName || "STRUCTURA").substring(0, 15).toUpperCase();
  stampMng.innerHTML = `<svg width="80" height="50" style="opacity: 0.65; transform: rotate(10deg); color: #6366f1;"><rect x="5" y="5" width="70" height="40" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><text x="40" y="22" font-size="9" text-anchor="middle" fill="currentColor" font-weight="bold">VALUACIÓN OK</text><text x="40" y="34" font-size="7" text-anchor="middle" fill="currentColor">${stampProjectName}</text></svg>`;
  
  stampAdm.innerHTML = `<svg width="80" height="50" style="opacity: 0.7; transform: rotate(-8deg); color: #059669;"><rect x="5" y="5" width="70" height="40" rx="5" fill="none" stroke="currentColor" stroke-width="3"/><text x="40" y="22" font-size="10" text-anchor="middle" fill="currentColor" font-weight="bold">ADMINISTRACIÓN</text><text x="40" y="34" font-size="8" text-anchor="middle" fill="currentColor">CAJA / PROCESADO</text></svg>`;
  
  if (reportType === "valuacion_general") {
    title.innerText = "VALUACIÓN DE OBRA E INVENTARIO GENERAL";
    
    // Generate Bill of Quantities Summary Table
    let tableHtml = `
      <thead>
        <tr>
          <th>Código</th>
          <th>Descripción de Trabajo</th>
          <th>Und</th>
          <th style="text-align: right;">Presupuestado</th>
          <th style="text-align: right;">Ejecutado</th>
          <th style="text-align: right;">% Avance</th>
          <th style="text-align: right;">Monto Ejecutado</th>
        </tr>
      </thead>
      <tbody>
    `;
    
    let totalBudget = 0;
    let totalExecuted = 0;
    
    appState.chapters.forEach(c => {
      // Chapter Header row
      tableHtml += `
        <tr style="background-color: #f1f5f9; font-weight: bold;">
          <td colspan="7" style="color: #0f172a;">${c.name}</td>
        </tr>
      `;
      
      c.partidas.forEach(p => {
        const pBudget = p.qtyBudget * p.priceUnit;
        const pExecuted = p.qtyExecuted * p.priceUnit;
        const pProgress = p.qtyBudget > 0 ? (p.qtyExecuted / p.qtyBudget) * 100 : 0;
        
        totalBudget += pBudget;
        totalExecuted += pExecuted;
        
        tableHtml += `
          <tr>
            <td><strong>${p.code}</strong></td>
            <td>${p.desc}</td>
            <td>${p.unit}</td>
            <td style="text-align: right;">${formatCurrency(pBudget)}</td>
            <td style="text-align: right;">${p.qtyExecuted.toFixed(2)}</td>
            <td style="text-align: right;">${pProgress.toFixed(0)}%</td>
            <td style="text-align: right; font-weight: 600;">${formatCurrency(pExecuted)}</td>
          </tr>
        `;
      });
    });
    
    const generalProgress = totalBudget > 0 ? (totalExecuted / totalBudget) * 100 : 0;
    
    // Add totals row
    tableHtml += `
        <tr class="report-table-totals">
          <td colspan="3">MONTO TOTAL DE LA OBRA</td>
          <td style="text-align: right;">${formatCurrency(totalBudget)}</td>
          <td colspan="2" style="text-align: right;">AVANCE GENERAL: ${generalProgress.toFixed(1)}%</td>
          <td style="text-align: right; color: #15803d;">${formatCurrency(totalExecuted)}</td>
        </tr>
      </tbody>
    `;
    table.innerHTML = tableHtml;
  } else {
    // History of payments report
    title.innerText = "REPORTE ADMINISTRATIVO DE DESEMBOLSOS Y CAJA";
    
    let tableHtml = `
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Concepto del Pago</th>
          <th>Proveedor / Beneficiario</th>
          <th>Categoría</th>
          <th>Estado</th>
          <th>Referencia</th>
          <th style="text-align: right;">Monto</th>
        </tr>
      </thead>
      <tbody>
    `;
    
    // Filter payments
    const filteredPayments = appState.payments.filter(p => {
      return providerFilter === "all" || p.providerId === providerFilter;
    });
    
    let totalPaid = 0;
    let totalPending = 0;
    
    if (filteredPayments.length === 0) {
      tableHtml += `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 2rem 0;">No existen movimientos de caja para los filtros indicados.</td></tr>`;
    } else {
      filteredPayments.forEach(p => {
        const prov = appState.providers.find(pr => pr.id === p.providerId) || { name: "N/A" };
        const statusText = p.status === "pagado" ? "PAGADO" : p.status === "autorizado" ? "LISTO EN CAJA" : p.status === "aprobado" ? "APROBADO ING." : "EN VALUACION";
        const statusColor = p.status === "pagado" ? "#16803d" : p.status === "autorizado" ? "#1d4ed8" : "#b45309";
        
        if (p.status === "pagado") {
          totalPaid += p.amount;
        } else {
          totalPending += p.amount;
        }
        
        tableHtml += `
          <tr>
            <td>${p.date}</td>
            <td><strong>${p.title}</strong><br><span style="font-size:0.75rem; color:#475569;">${p.notes}</span></td>
            <td>${prov.name}</td>
            <td style="text-transform: capitalize;">${p.category}</td>
            <td style="font-weight: bold; color: ${statusColor};">${statusText}</td>
            <td>${p.ref || '-'}</td>
            <td style="text-align: right; font-weight: 600;">${formatCurrency(p.amount)}</td>
          </tr>
        `;
      });
    }
    
    tableHtml += `
        <tr class="report-table-totals">
          <td colspan="4">TOTALES ACUMULADOS</td>
          <td colspan="2" style="text-align: right;">PENDIENTES CAJA: ${formatCurrency(totalPending)}</td>
          <td style="text-align: right; color: #16803d;">PAGADO: ${formatCurrency(totalPaid)}</td>
        </tr>
      </tbody>
    `;
    table.innerHTML = tableHtml;
  }
}

// Generate CSV data from active report table
function exportReportToCSV() {
  const table = document.getElementById("report-dynamic-table");
  let csv = [];
  const rows = table.querySelectorAll("tr");
  
  for (let i = 0; i < rows.length; i++) {
    const row = [], cols = rows[i].querySelectorAll("td, th");
    
    for (let j = 0; j < cols.length; j++) {
      // Clean texts and remove commas for CSV formatting
      let cleanText = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, " ").trim();
      cleanText = cleanText.replace(/"/g, '""'); // Double quote escape
      row.push('"' + cleanText + '"');
    }
    csv.push(row.join(","));
  }
  
  const csvString = csv.join("\n");
  const filename = `Structura_Reporte_Obra_${new Date().toISOString().split('T')[0]}.csv`;
  const link = document.createElement("a");
  
  link.setAttribute("href", "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(csvString));
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  logActivity(`Reportes: Exportado reporte administrativo en CSV (${filename})`, "primary");
}

/* CURRENCY FORMATTER HELPER */
function formatCurrency(value) {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

// Send alert through Telegram API using current configuration
async function sendTelegramNotification(message) {
  if (!appState.telegramConfig || !appState.telegramConfig.enabled) return false;
  const { token, chatId } = appState.telegramConfig;
  return await sendTelegramRawMessage(token, chatId, message);
}

// Raw sender with custom credentials
async function sendTelegramRawMessage(token, chatId, text) {
  if (!token || !chatId) return false;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });
    return response.ok;
  } catch (e) {
    console.error("Error al enviar notificación a Telegram:", e);
    return false;
  }
}

// Global variable to hold base64 image data
let uploadedInvoiceBase64 = "";

// Show payment attachment details in modal
function viewPaymentInvoice(paymentId, event) {
  if (event) event.stopPropagation(); // Avoid triggering drag drop actions
  const p = appState.payments.find(pay => pay.id === paymentId);
  if (!p || !p.invoiceImage) return;
  
  const prov = appState.providers.find(pr => pr.id === p.providerId) || { name: "Contratista N/A" };
  document.getElementById("view-invoice-image-full").src = p.invoiceImage;
  document.getElementById("view-invoice-title").innerText = `${p.title} - ${prov.name} (${formatCurrency(p.amount)})`;
  document.getElementById("view-invoice-bank").innerText = p.bankDetails ? `Datos Bancarios:\n${p.bankDetails}` : "Sin datos de transferencia registrados.";
  
  openModal("modal-view-invoice");
}

// Autofill bank account based on selected provider
function triggerPaymentProviderAutofill() {
  const provId = document.getElementById("pay-provider-select").value;
  if (!provId) return;
  
  const prov = appState.providers.find(p => p.id === provId);
  if (prov) {
    document.getElementById("pay-bank-input").value = prov.bankDetails || "";
  }
}

// Global deletion handlers for Payments, Materials, Chapters, and Partidas
function deletePaymentRequest(paymentId) {
  const p = appState.payments.find(pay => pay.id === paymentId);
  if (!p) return;
  if (confirm(`¿Estás seguro de que deseas eliminar la solicitud de pago "${p.title}" por ${formatCurrency(p.amount)}?`)) {
    appState.payments = appState.payments.filter(pay => pay.id !== paymentId);
    saveAppState();
    renderPayments();
    renderDashboard();
    logActivity(`Solicitud de pago eliminada: ${p.title} (${formatCurrency(p.amount)})`, "warning");
  }
}

function deleteMaterial(matId) {
  const mat = appState.materials.find(m => m.id === matId);
  if (!mat) return;
  if (confirm(`¿Estás seguro de que deseas eliminar el material "${mat.name}" del almacén?`)) {
    appState.materials = appState.materials.filter(m => m.id !== matId);
    saveAppState();
    renderMaterials();
    renderDashboard();
    logActivity(`Material eliminado del almacén: ${mat.name}`, "warning");
  }
}

function deleteChapter(event, chapId) {
  if (event) event.stopPropagation();
  const chap = appState.chapters.find(c => c.id === chapId);
  if (!chap) return;
  if (confirm(`¿Estás seguro de que deseas eliminar el capítulo "${chap.name}" junto con todas sus partidas?`)) {
    appState.chapters = appState.chapters.filter(c => c.id !== chapId);
    saveAppState();
    renderComputos();
    renderDashboard();
    logActivity(`Capítulo eliminado: ${chap.name}`, "warning");
  }
}

function deletePartida(chapId, partId) {
  const chap = appState.chapters.find(c => c.id === chapId);
  if (!chap) return;
  const part = chap.partidas.find(p => p.id === partId);
  if (!part) return;
  if (confirm(`¿Estás seguro de que deseas eliminar la partida "${part.code} - ${part.desc}"?`)) {
    chap.partidas = chap.partidas.filter(p => p.id !== partId);
    saveAppState();
    renderComputos();
    renderDashboard();
    logActivity(`Partida eliminada: [${part.code}] ${part.desc}`, "warning");
  }
}

function deleteProvider(provId) {
  const prov = appState.providers.find(p => p.id === provId);
  if (!prov) return;
  if (confirm(`¿Estás seguro de que deseas eliminar al proveedor "${prov.name}"?\nEsto no afectará los registros de pagos históricos ya creados.`)) {
    appState.providers = appState.providers.filter(p => p.id !== provId);
    saveAppState();
    renderProviders();
    renderDashboard();
    logActivity(`Proveedor eliminado: ${prov.name}`, "warning");
  }
}
