let products = [];
let cart = {};
let currentCategory = "ALL";
let currentYearFilter = "";
let currentSizeFilter = "";
let customerPhone = "";
let customerName = "";
let branchNames = [];
let branchSettingOpen = false;
let activeBranchSku = "";
let quickBranchSku = "";

let categoryCardCache = {};
let cardBySku = {};

let latestProductsJsonText = "";
let refreshLock = false;
const APP_ASSET_VERSION = "202606162015";
const BRANCH_NAMES_STORAGE_KEY = "branchNames";

const mainBrandCategories = [
  "APLUS VIETNAM",
  "APLUS",
  "ROCKBLADE",
  "HILO",
  "ARDENT",
  "RAUFFAN",
  "CROSSMAXX",
  "NEOLIN",
  "ROTALLA"
];

const brandCategories = [
  "ALL",
  "APLUS VIETNAM",
  "APLUS",
  "ROCKBLADE",
  "HILO",
  "ARDENT",
  "RAUFFAN",
  "CROSSMAXX",
  "NEOLIN",
  "ROTALLA",
  "OTHERS"
];

function ensureAplusVietnamCategoryButton(){
  const brandBar = document.getElementById("brandCategoryBar") || document.querySelector(".categoryMenu");
  if(!brandBar){
    return;
  }

  let button = brandBar.querySelector('button[data-category="APLUS VIETNAM"]');

  if(!button){
    button = document.createElement("button");
    const allButton = brandBar.querySelector('button[data-category="ALL"]');

    if(allButton && allButton.nextSibling){
      brandBar.insertBefore(button, allButton.nextSibling);
    }else if(allButton){
      brandBar.appendChild(button);
    }else{
      brandBar.insertBefore(button, brandBar.firstChild);
    }
  }

  button.className = "brandCategoryButton";
  button.dataset.category = "APLUS VIETNAM";
  button.onclick = () => showCategory("APLUS VIETNAM");
  button.innerHTML = "";

  const img = document.createElement("img");
  img.src = `aplus-vietnam-logo.jpg?v=${APP_ASSET_VERSION}`;
  img.alt = "APLUS VIETNAM";
  img.onerror = function(){
    brandLogoMissing(img);
  };

  const span = document.createElement("span");
  span.textContent = "APLUS VIETNAM";

  button.appendChild(img);
  button.appendChild(span);
}

function ensureInteractionStyleFixes(){
  let style = document.getElementById("codexInteractionStyleFixes");
  if(!style){
    style = document.createElement("style");
    style.id = "codexInteractionStyleFixes";
    document.head.appendChild(style);
  }

  style.textContent = `
    .card {
      transition: filter 0.15s ease !important;
    }

    .card:active {
      transform: none !important;
    }

    .grid,
    main {
      padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px)) !important;
    }

    @media (max-width: 800px) {
      .grid,
      main {
        padding-bottom: calc(170px + env(safe-area-inset-bottom, 0px)) !important;
      }
    }

    #branchSettingButton {
      width: 100%;
      margin: 12px 0 8px;
      background: #333;
    }

    .branchSettingPanel,
    .branchSplitPanel,
    .quickBranchDropdown {
      background: #f7f7f7;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      padding: 10px;
      margin: 8px 0;
    }

    .branchSettingPanel h3,
    .branchSplitPanel h4,
    .quickBranchDropdown h4 {
      margin: 0 0 10px;
      font-size: 15px;
    }

    .branchInputRow,
    .branchQtyRow {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .branchInputRow label,
    .branchQtyRow label {
      flex: 0 0 88px;
      font-size: 13px;
      font-weight: bold;
      word-break: break-word;
    }

    .branchInputRow input,
    .branchQtyRow input {
      flex: 1;
      min-width: 0;
      height: 40px;
      padding: 8px 10px;
      border: 1px solid #ccc;
      border-radius: 9px;
      font-size: 16px;
    }

    .branchQtyRow input {
      max-width: 110px;
      text-align: center;
      font-weight: bold;
    }

    .branchEditorActions {
      display: flex;
      gap: 8px;
      margin-top: 10px;
    }

    .branchEditorActions button {
      flex: 1;
    }

    .branchButton {
      background: #333;
    }

    .cartActionRow {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }

    .cartActionRow button {
      flex: 1;
    }

    .branchPreview {
      margin-top: 8px;
      color: #333;
      font-size: 12px;
      line-height: 1.35;
      font-weight: bold;
      word-break: break-word;
    }

    .branchSplitTotal {
      margin-top: 6px;
      font-size: 13px;
      font-weight: bold;
    }

    .card.quickBranchOpen {
      height: auto !important;
      min-height: 345px;
      overflow: visible;
    }

    .card.quickBranchOpen .orderArea {
      display: block;
      height: auto;
    }

    .quickBranchDropdown {
      width: 100%;
      margin: 0;
    }

    .quickBranchDropdown .branchEditorActions button {
      padding: 10px 8px;
      font-size: 12px;
    }

    @media (max-width: 600px) {
      .branchInputRow,
      .branchQtyRow {
        align-items: flex-start;
        flex-direction: column;
        gap: 5px;
      }

      .branchInputRow label,
      .branchQtyRow label {
        flex: 0 0 auto;
      }

      .branchQtyRow input {
        max-width: none;
        width: 100%;
      }

      .card.quickBranchOpen {
        min-height: 345px;
      }
    }

    @media (max-width: 380px) {
      .card.quickBranchOpen {
        min-height: 405px;
      }
    }
  `;
}

function goBackToTop(){
  const grid = document.getElementById("productGrid");
  const cartPanel = document.getElementById("cartPanel");

  if(grid){
    grid.scrollTop = 0;
  }

  if(cartPanel && !cartPanel.classList.contains("hidden")){
    cartPanel.scrollTop = 0;
  }

  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function resetBarsToLeft(){
  const sizeBar = document.querySelector(".pcdMenu");
  const brandBar = document.getElementById("brandCategoryBar") || document.querySelector(".categoryMenu");

  function forceLeft(el){
    if(!el) return;

    el.scrollLeft = 0;

    requestAnimationFrame(() => {
      el.scrollLeft = 0;
    });

    setTimeout(() => {
      el.scrollLeft = 0;
    }, 50);

    setTimeout(() => {
      el.scrollLeft = 0;
    }, 150);

    setTimeout(() => {
      el.scrollLeft = 0;
    }, 300);

    setTimeout(() => {
      el.scrollLeft = 0;
    }, 600);
  }

  forceLeft(sizeBar);
  forceLeft(brandBar);
}

function renderAndStayTop(){
  ensureAplusVietnamCategoryButton();
  updateActiveButtons();
  showCachedCategory();
  goBackToTop();
}

function brandLogoMissing(img){
  const button = img.closest("button");

  if(button){
    button.classList.add("logoMissing");
  }

  img.style.display = "none";
}

async function loadProducts(){
  try{
    const res = await fetch('products.json?refresh=' + Date.now(), {
      cache: 'no-store'
    });

    latestProductsJsonText = await res.text();
    products = JSON.parse(latestProductsJsonText);

    assignInternalSkus();
    buildProductCardsOnce();
    showCachedCategory();
    updateActiveButtons();
    updateClearSearchButton();
    resetBarsToLeft();
  }catch(err){
    console.error("Cannot load products.json:", err);

    const grid = document.getElementById("productGrid");
    if(grid){
      grid.innerHTML = `
        <div style="background:white;padding:20px;border-radius:10px;font-weight:bold;color:#b00020;">
          products.json error. Please export products.json again.
        </div>
      `;
    }
  }
}

async function autoRefreshProducts(){
  try{
    const res = await fetch('products.json?refresh=' + Date.now(), {
      cache: 'no-store'
    });

    const newText = await res.text();

    if(newText === latestProductsJsonText){
      return;
    }

    latestProductsJsonText = newText;
    products = JSON.parse(newText);

    assignInternalSkus();

    categoryCardCache = {};
    cardBySku = {};

    buildProductCardsOnce();

    Object.keys(cart).forEach(sku => {
      const stillExists = products.some(p => getProductSku(p) === sku && shouldShowProduct(p));

      if(!stillExists){
        delete cart[sku];

        if(activeBranchSku === sku){
          activeBranchSku = "";
        }

        if(quickBranchSku === sku){
          quickBranchSku = "";
        }
      }
    });

    renderCart();
    showCachedCategory();
    updateCartCountOnly();
    resetBarsToLeft();

    console.log("products.json updated automatically");

  }catch(err){
    console.log("Auto refresh failed:", err);
  }
}

function assignInternalSkus(){
  products.forEach((p, index) => {
    const existingSku = cleanValue(
      p.__sku ||
      p.sku ||
      p.SKU
    );

    if(existingSku){
      p.__sku = existingSku;
      return;
    }

    const brand = getProductCategoryBrand(p);
    const description = getProductDescription(p);
    const photo = getProductPhotoText(p);
    const price = getProductPrice(p);
    const status = getProductStatus(p);

    p.__sku = `${index}-${brand}-${description}-${photo}-${price}-${status}`;
  });
}

function cleanValue(value){
  if(value === null || value === undefined) return "";
  return String(value).trim();
}

function parsePositiveInteger(value){
  const qty = parseInt(String(value || "").trim(), 10);

  if(isNaN(qty) || qty <= 0){
    return 0;
  }

  return qty;
}

function sanitizeBranchNames(list){
  const seen = new Set();
  const result = [];

  (list || []).forEach(name => {
    const cleaned = cleanValue(name);
    const normalized = cleaned.toUpperCase();

    if(!cleaned || seen.has(normalized)){
      return;
    }

    seen.add(normalized);
    result.push(cleaned);
  });

  return result;
}

function getBranchQtyTotal(branchMap){
  return Object.values(branchMap || {}).reduce((total, qty) => {
    return total + parsePositiveInteger(qty);
  }, 0);
}

function loadBranchNames(){
  try{
    const raw = localStorage.getItem(BRANCH_NAMES_STORAGE_KEY);
    branchNames = sanitizeBranchNames(JSON.parse(raw || "[]")).slice(0, 10);
  }catch(err){
    branchNames = [];
  }
}

function saveBranchNames(){
  localStorage.setItem(BRANCH_NAMES_STORAGE_KEY, JSON.stringify(branchNames));
}

function normalizeCartItem(sku){
  const item = cart[sku];

  if(!item){
    return null;
  }

  if(typeof item === "number"){
    cart[sku] = {
      qty: item,
      branches: {}
    };

    return cart[sku];
  }

  if(typeof item === "object"){
    item.qty = parsePositiveInteger(item.qty);

    if(!item.branches || typeof item.branches !== "object"){
      item.branches = {};
    }

    return item;
  }

  return null;
}

function getCartItem(sku){
  return normalizeCartItem(sku);
}

function getCartQty(sku){
  const item = getCartItem(sku);
  return item ? item.qty : 0;
}

function getCartBranches(sku){
  const item = getCartItem(sku);
  return item ? item.branches : {};
}

function setCartQty(sku, qty){
  qty = parsePositiveInteger(qty);

  if(qty <= 0){
    delete cart[sku];

    if(activeBranchSku === sku){
      activeBranchSku = "";
    }

    if(quickBranchSku === sku){
      quickBranchSku = "";
    }

    return;
  }

  const item = getCartItem(sku) || { qty: 0, branches: {} };
  item.qty = qty;
  cart[sku] = item;
}

function hasBranchSplit(sku){
  return Object.values(getCartBranches(sku)).some(qty => Number(qty) > 0);
}

function getBranchTotal(sku){
  return getBranchQtyTotal(getCartBranches(sku));
}

function getBranchPreviewHtml(sku){
  const parts = Object.entries(getCartBranches(sku))
    .filter(([, qty]) => Number(qty) > 0)
    .map(([name, qty]) => `${escapeHtml(name)}: ${qty}`);

  if(parts.length === 0){
    return "";
  }

  return `<div class="branchPreview">${parts.join(" | ")}</div>`;
}

function scrollProductCardIntoView(sku){
  const card = cardBySku[sku];
  const grid = document.getElementById("productGrid");

  if(!card){
    return;
  }

  const scrollToCard = () => {
    if(grid && grid.scrollHeight > grid.clientHeight){
      const gridRect = grid.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const top = grid.scrollTop + (cardRect.top - gridRect.top) - 12;

      grid.scrollTo({
        top: Math.max(top, 0),
        behavior: "smooth"
      });

      return;
    }

    const header = document.getElementById("mainHeader");
    const brandBar = document.getElementById("brandCategoryBar") || document.querySelector(".categoryMenu");
    const headerBottom = Math.max(
      header ? header.getBoundingClientRect().bottom : 0,
      brandBar ? brandBar.getBoundingClientRect().bottom : 0
    );
    const rect = card.getBoundingClientRect();
    const top = window.scrollY + rect.top - headerBottom - 12;

    window.scrollTo({
      top: Math.max(top, 0),
      behavior: "smooth"
    });
  };

  requestAnimationFrame(scrollToCard);
  setTimeout(scrollToCard, 220);
}

function openBranchSettings(){
  branchSettingOpen = !branchSettingOpen;
  renderBranchSettingPanel();
}

function closeBranchSettings(){
  branchSettingOpen = false;
  renderBranchSettingPanel();
}

function saveBranchSettings(){
  const inputs = document.querySelectorAll("#branchSettingPanel input[data-branch-index]");
  const names = Array.from(inputs)
    .map(input => cleanValue(input.value))
    .filter(Boolean);

  const uniqueNames = sanitizeBranchNames(names);

  if(uniqueNames.length > 10){
    alert("Maximum 10 branches only.");
    return;
  }

  branchNames = uniqueNames.slice(0, 10);
  quickBranchSku = "";
  saveBranchNames();

  Object.keys(cart).forEach(sku => {
    const item = getCartItem(sku);
    if(!item) return;

    Object.keys(item.branches).forEach(name => {
      if(!branchNames.includes(name)){
        delete item.branches[name];
      }
    });

    const branchTotal = getBranchQtyTotal(item.branches);

    if(branchTotal > 0){
      item.qty = branchTotal;
    }else{
      item.branches = {};
    }
  });

  branchSettingOpen = false;
  renderCart();
  updateAllProductOrderAreas();
}

function focusQuickBranchDropdown(sku){
  setTimeout(() => {
    const card = cardBySku[sku];
    if(!card) return;

    const firstBranchQty = card.querySelector(".quickBranchDropdown input[data-branch-name]");
    if(firstBranchQty){
      firstBranchQty.focus();
      firstBranchQty.select();
    }
  }, 50);
}

function focusCartBranchSplit(sku){
  setTimeout(() => {
    const firstBranchQty = document.querySelector(`.cartRow[data-sku="${cssEscapeValue(sku)}"] .branchSplitPanel input[data-branch-name]`);
    if(firstBranchQty){
      firstBranchQty.focus();
      firstBranchQty.select();
    }
  }, 50);
}

function isCartPanelOpen(){
  const cartPanel = document.getElementById("cartPanel");
  return !!cartPanel && !cartPanel.classList.contains("hidden");
}

function openBranchQuantityEditor(sku){
  if(branchNames.length === 0 || getCartQty(sku) <= 0){
    return false;
  }

  if(isCartPanelOpen()){
    activeBranchSku = sku;
    quickBranchSku = "";
    branchSettingOpen = false;
    renderCart();
    updateProductOrderArea(sku);
    focusCartBranchSplit(sku);
    return true;
  }

  const previousQuickSku = quickBranchSku;
  activeBranchSku = "";
  quickBranchSku = sku;

  if(previousQuickSku && previousQuickSku !== sku){
    updateProductOrderArea(previousQuickSku);
  }

  updateProductOrderArea(sku);
  focusQuickBranchDropdown(sku);
  return true;
}

function addToCartFromProduct(sku){
  if(branchNames.length > 0 && getCartQty(sku) === 0){
    const previousQuickSku = quickBranchSku;
    quickBranchSku = quickBranchSku === sku ? "" : sku;

    if(previousQuickSku && previousQuickSku !== sku){
      updateProductOrderArea(previousQuickSku);
    }

    updateProductOrderArea(sku);

    if(quickBranchSku === sku){
      focusQuickBranchDropdown(sku);
    }

    return;
  }

  changeQty(sku, 1);
}

function saveQuickBranchDropdown(sku){
  const card = cardBySku[sku];
  if(!card) return;

  const inputs = card.querySelectorAll(".quickBranchDropdown input[data-branch-name]");
  const branches = {};
  let total = 0;

  inputs.forEach(input => {
    const name = cleanValue(input.dataset.branchName);
    const qty = parsePositiveInteger(input.value);

    if(qty > 0){
      branches[name] = qty;
      total += qty;
    }
  });

  if(total <= 0){
    if(getCartQty(sku) > 0){
      delete cart[sku];
      quickBranchSku = "";
      renderCart();
      updateProductOrderArea(sku);
      scrollProductCardIntoView(sku);
      return;
    }

    alert("Please enter branch quantity.");
    return;
  }

  cart[sku] = {
    qty: total,
    branches
  };

  quickBranchSku = "";
  renderCart();
  updateProductOrderArea(sku);
  scrollProductCardIntoView(sku);
}

function cancelQuickBranchDropdown(sku){
  if(quickBranchSku === sku){
    quickBranchSku = "";
  }

  updateProductOrderArea(sku);
  scrollProductCardIntoView(sku);
}

function renderBranchSettingPanel(){
  const panel = document.getElementById("branchSettingPanel");

  if(!panel){
    return;
  }

  if(!branchSettingOpen){
    panel.classList.add("hidden");
    panel.innerHTML = "";
    return;
  }

  panel.classList.remove("hidden");

  const rows = [];

  for(let i = 0; i < 10; i++){
    rows.push(`
      <div class="branchInputRow">
        <label>Branch ${i + 1}</label>
        <input
          type="text"
          maxlength="40"
          value="${escapeHtml(branchNames[i] || "")}"
          placeholder="Branch name"
          data-branch-index="${i}"
        >
      </div>
    `);
  }

  panel.innerHTML = `
    <h3>Branch Setting</h3>
    ${rows.join("")}
    <div class="branchEditorActions">
      <button type="button" onclick="saveBranchSettings()">Save Branch Names</button>
      <button type="button" onclick="closeBranchSettings()">Cancel</button>
    </div>
  `;
}

function toggleBranchSplit(sku){
  if(branchNames.length === 0){
    alert("Please set branch names first.");
    return;
  }

  activeBranchSku = activeBranchSku === sku ? "" : sku;
  renderCart();
}

function renderBranchSplitPanel(sku){
  if(activeBranchSku !== sku || branchNames.length === 0){
    return "";
  }

  const branches = getCartBranches(sku);
  const rows = branchNames.map(name => `
    <div class="branchQtyRow">
      <label>${escapeHtml(name)}</label>
      <input
        type="number"
        min="0"
        inputmode="numeric"
        value="${branches[name] || ""}"
        data-branch-name="${escapeHtml(name)}"
        placeholder="0"
      >
    </div>
  `);

  return `
    <div class="branchSplitPanel">
      <h4>Branch Split</h4>
      ${rows.join("")}
      <div class="branchSplitTotal">Cart Qty: ${getCartQty(sku)} PCS</div>
      <div class="branchEditorActions">
        <button type="button" onclick="saveBranchSplit('${escapeJsString(sku)}')">Save Branch Split</button>
        <button type="button" onclick="cancelBranchSplit('${escapeJsString(sku)}')">Cancel</button>
      </div>
    </div>
  `;
}

function saveBranchSplit(sku){
  const row = document.querySelector(`.cartRow[data-sku="${cssEscapeValue(sku)}"]`);
  if(!row) return;

  const inputs = row.querySelectorAll(".branchSplitPanel input[data-branch-name]");
  const branches = {};
  let total = 0;

  inputs.forEach(input => {
    const name = cleanValue(input.dataset.branchName);
    const qty = parsePositiveInteger(input.value);

    if(qty > 0){
      branches[name] = qty;
      total += qty;
    }
  });

  if(total <= 0){
    delete cart[sku];
    activeBranchSku = "";
    renderCart();
    updateProductOrderArea(sku);
    return;
  }

  const item = getCartItem(sku);
  if(!item) return;

  item.qty = total;
  item.branches = branches;
  activeBranchSku = "";
  renderCart();
  updateProductOrderArea(sku);
}

function cancelBranchSplit(sku){
  if(activeBranchSku === sku){
    activeBranchSku = "";
  }

  renderCart();
}

function getProductSku(product){
  return cleanValue(product.__sku);
}

function getProductCategoryBrand(product){
  return cleanValue(
    product["CategoryBrand"] ||
    product["CATEGORY_BRAND"] ||
    product["Category Brand"] ||
    product["Brand"] ||
    product["BRAND"] ||
    product["brand"]
  ).toUpperCase();
}

function getProductDisplayBrand(product){
  return cleanValue(
    product["DisplayBrand"] ||
    product["DISPLAY_BRAND"] ||
    product["Display Brand"] ||
    product["CategoryBrand"] ||
    product["CATEGORY_BRAND"] ||
    product["Category Brand"] ||
    product["Brand"] ||
    product["BRAND"] ||
    product["brand"]
  ).toUpperCase();
}

function getProductBrand(product){
  return getProductCategoryBrand(product);
}

function getProductDescription(product){
  return cleanValue(
    product["Product Descriptions"] ||
    product["PRODUCT DESCRIPTIONS"] ||
    product["Product Description"] ||
    product["product descriptions"] ||
    product["description"]
  );
}

function getProductPhotoText(product){
  return cleanValue(
    product["PHOTO"] ||
    product["Photo"] ||
    product["photo"]
  );
}

function getProductPhotoUrl(product){
  let url = cleanValue(
    product["PHOTO_URL"] ||
    product["Photo URL"] ||
    product["photoUrl"] ||
    product["photo_url"]
  );

  if(!url) return "";

  if(url.includes("/d/")){
    const fileId = url.split("/d/")[1].split("/")[0];
    return "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1200&cache=" + Date.now();
  }

  if(url.includes("id=")){
    const fileId = url.split("id=")[1].split("&")[0];
    return "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1200&cache=" + Date.now();
  }

  return url;
}

function getProductPrice(product){
  return cleanValue(
    product["PRICE"] ||
    product["Price"] ||
    product["price"]
  );
}

function getProductStatus(product){
  return cleanValue(
    product["STATUS"] ||
    product["Status"] ||
    product["status"]
  );
}

function getProductRowColor(product){
  return cleanValue(
    product["rowColor"] ||
    product["ROW_COLOR"] ||
    product["Row Color"]
  );
}

function getStatusBgColor(product){
  return cleanValue(
    product["statusBgColor"] ||
    product["STATUS_BG_COLOR"] ||
    product["Status Bg Color"]
  );
}

function getStatusFontColor(product){
  return cleanValue(
    product["statusFontColor"] ||
    product["STATUS_FONT_COLOR"] ||
    product["Status Font Color"]
  );
}

function getProductSizeFilter(product){
  const desc = getProductDescription(product).toUpperCase();

  let match = desc.match(/R\s?(\d{2})/);

  if(match){
    return "R" + match[1];
  }

  match = desc.match(/(\d{2})R/);

  if(match){
    return "R" + match[1];
  }

  return "";
}

function getProductYear(product){
  const allText = `
    ${getProductDescription(product)}
    ${getProductStatus(product)}
  `.toUpperCase();

  const match = allText.match(/Y\s?(20|21|22|23|24|25|26)/);

  if(match){
    return "Y" + match[1];
  }

  return "";
}

function shouldShowProduct(product){
  const brand = getProductCategoryBrand(product);
  const description = getProductDescription(product);
  const photo = getProductPhotoText(product);
  const photoUrl = getProductPhotoUrl(product);
  const price = getProductPrice(product);
  const status = getProductStatus(product);

  const statusText = status.toLowerCase();

  if(!brand && !description && !photo && !photoUrl && !price && !status){
    return false;
  }

  if(statusText.includes("sold out")){
    return false;
  }

  if(statusText.includes("not available")){
    return false;
  }

  if(statusText.includes("no stock")){
    return false;
  }

  if(statusText.includes("out of stock")){
    return false;
  }

  if(statusText.includes("#n/a")){
    return false;
  }

  return true;
}

function isValidWhatsappNumber(phone){
  phone = phone.replace(/\D/g, '');
  return /^60\d{8,10}$/.test(phone);
}

function resetFiltersToAll(){
  currentCategory = "ALL";
  currentYearFilter = "";
  currentSizeFilter = "";
}

function checkLogin(){
  const savedPhone = localStorage.getItem("customerPhone");
  const savedName = localStorage.getItem("customerName");

  if(
    savedPhone &&
    savedName &&
    isValidWhatsappNumber(savedPhone) &&
    savedName.trim() !== ""
  ){
    customerPhone = savedPhone;
    customerName = savedName;
    document.getElementById('loginScreen').classList.add('hidden');
  }else{
    document.getElementById('loginScreen').classList.remove('hidden');
  }
}

document.getElementById('loginButton').onclick = () => {
  let name = document.getElementById('loginName').value.trim();
  let phone = document.getElementById('loginPhone').value.trim();

  phone = phone.replace(/\D/g, '');

  if(name === ""){
    document.getElementById('loginError').textContent =
      "Please enter customer name";
    return;
  }

  if(!isValidWhatsappNumber(phone)){
    document.getElementById('loginError').textContent =
      "Please enter a valid WhatsApp number. Example: 60123456789";
    return;
  }

  customerName = name;
  customerPhone = phone;

  localStorage.setItem("customerName", name);
  localStorage.setItem("customerPhone", phone);

  resetFiltersToAll();
  resetBarsToLeft();

  document.getElementById('search').value = "";
  updateClearSearchButton();

  cart = {};
  activeBranchSku = "";
  quickBranchSku = "";
  branchSettingOpen = false;
  renderCart();

  document.getElementById('loginError').textContent = "";
  document.getElementById('loginScreen').classList.add('hidden');

  renderAndStayTop();
};

document.getElementById('logoutButton').onclick = () => {
  localStorage.removeItem("customerName");
  localStorage.removeItem("customerPhone");
  localStorage.removeItem(BRANCH_NAMES_STORAGE_KEY);

  customerName = "";
  customerPhone = "";
  cart = {};
  branchNames = [];
  activeBranchSku = "";
  quickBranchSku = "";
  branchSettingOpen = false;

  resetFiltersToAll();
  resetBarsToLeft();

  document.getElementById('search').value = "";
  updateClearSearchButton();

  renderCart();
  closePhotoViewer();

  document.getElementById('loginName').value = "";
  document.getElementById('loginPhone').value = "";
  document.getElementById('loginError').textContent = "";
  document.getElementById('cartPanel').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');

  renderAndStayTop();
};

function showCategory(category){
  if(brandCategories.includes(category)){
    currentCategory = category;
  }

  renderAndStayTop();
}

function showYearDropdown(event){
  if(event){
    event.stopPropagation();
  }

  const dropdown = document.getElementById('yearDropdown');
  const yearButton = document.getElementById('yearButton');

  if(!dropdown || !yearButton) return;

  const rect = yearButton.getBoundingClientRect();

  dropdown.style.left = rect.left + "px";
  dropdown.style.top = (rect.bottom + 6) + "px";

  dropdown.classList.toggle('hidden');
}

function showYear(year){
  if(currentYearFilter === year){
    currentYearFilter = "";
  }else{
    currentYearFilter = year;
  }

  const dropdown = document.getElementById('yearDropdown');

  if(dropdown){
    dropdown.classList.add('hidden');
  }

  renderAndStayTop();
}

function clearYear(){
  currentYearFilter = "";

  const dropdown = document.getElementById('yearDropdown');

  if(dropdown){
    dropdown.classList.add('hidden');
  }

  renderAndStayTop();
}

function showSize(size){
  if(currentSizeFilter === size){
    currentSizeFilter = "";
  }else{
    currentSizeFilter = size;
  }

  renderAndStayTop();
}

function productMatchesBrand(product){
  if(currentCategory === "ALL"){
    return true;
  }

  const brand = getProductCategoryBrand(product);
  const desc = getProductDescription(product).toUpperCase();

  if(currentCategory === "OTHERS"){
    return !mainBrandCategories.some(mainBrand => {
      return brand === mainBrand || desc.includes(mainBrand);
    });
  }

  return brand === currentCategory || desc.includes(currentCategory);
}

function productMatchesYear(product){
  if(!currentYearFilter){
    return true;
  }

  const year = getProductYear(product);
  const desc = getProductDescription(product).toUpperCase();

  return year === currentYearFilter || desc.includes(currentYearFilter);
}

function productMatchesSize(product){
  if(!currentSizeFilter){
    return true;
  }

  const size = getProductSizeFilter(product);
  const desc = getProductDescription(product).toUpperCase();

  return size === currentSizeFilter || desc.includes(currentSizeFilter);
}

function updateActiveButtons(){
  document.querySelectorAll('.categoryMenu button').forEach(btn => {
    btn.classList.remove('active');

    const btnCategory = cleanValue(btn.dataset.category || btn.textContent).toUpperCase();

    if(btnCategory === currentCategory){
      btn.classList.add('active');
    }
  });

  document.querySelectorAll('.pcdMenu button').forEach(btn => {
    btn.classList.remove('active');

    if(btn.textContent.trim().toUpperCase() === currentSizeFilter){
      btn.classList.add('active');
    }
  });

  document.querySelectorAll('.yearDropdown button').forEach(btn => {
    btn.classList.remove('active');

    if(btn.textContent.trim().toUpperCase() === currentYearFilter){
      btn.classList.add('active');
    }
  });

  const yearButton = document.getElementById('yearButton');

  if(yearButton){
    if(currentYearFilter){
      yearButton.classList.add('active');
      yearButton.textContent = currentYearFilter;
    }else{
      yearButton.classList.remove('active');
      yearButton.textContent = "YEAR";
    }
  }
}

function buildProductCardsOnce(){
  const grid = document.getElementById('productGrid');

  if(!grid){
    return;
  }

  grid.innerHTML = "";
  categoryCardCache = {};
  cardBySku = {};

  const visibleProducts = products.filter(p => shouldShowProduct(p));

  categoryCardCache["ALL_PRODUCTS"] = visibleProducts.map(p => {
    const sku = getProductSku(p);
    const card = createProductCard(p);

    cardBySku[sku] = card;
    grid.appendChild(card);

    return card;
  });
}

function showCachedCategory(){
  const grid = document.getElementById('productGrid');

  if(!grid){
    return;
  }

  if(!categoryCardCache["ALL_PRODUCTS"]){
    buildProductCardsOnce();
  }

  const q = document.getElementById('search').value.toLowerCase();

  categoryCardCache["ALL_PRODUCTS"].forEach(card => {
    const sku = card.dataset.sku;
    const p = products.find(x => getProductSku(x) === sku);

    if(!p || !shouldShowProduct(p)){
      card.style.display = "none";
      return;
    }

    const searchable = `
      ${getProductDisplayBrand(p)}
      ${getProductDescription(p)}
    `.toLowerCase();

    const matchSearch = searchable.includes(q);
    const matchBrand = productMatchesBrand(p);
    const matchYear = productMatchesYear(p);
    const matchSize = productMatchesSize(p);

    if(matchSearch && matchBrand && matchYear && matchSize){
      card.style.display = "";
    }else{
      card.style.display = "none";
    }
  });
}

function isSoldOut(product){
  return !shouldShowProduct(product);
}

function syncQtyEverywhere(sku, value, sourceInput){
  const valueText = String(value || "");

  const card = cardBySku[sku];

  if(card){
    const productQtyInput = card.querySelector(".qtyInput");

    if(productQtyInput && productQtyInput !== sourceInput){
      productQtyInput.value = valueText;
    }
  }

  document.querySelectorAll(`#cartItems .qtyInput[data-sku="${cssEscapeValue(sku)}"]`).forEach(input => {
    if(input !== sourceInput){
      input.value = valueText;
    }
  });

  updateCartCountOnly();
}

function setQtyTyping(sku, value, sourceInput){
  if(branchNames.length > 0 && getCartQty(sku) > 0){
    syncQtyEverywhere(sku, getCartQty(sku) || "", sourceInput);
    openBranchQuantityEditor(sku);
    return;
  }

  const text = String(value || "").trim();

  if(text === ""){
    syncQtyEverywhere(sku, "", sourceInput);
    return;
  }

  let qty = parseInt(text, 10);

  if(isNaN(qty) || qty <= 0){
    syncQtyEverywhere(sku, text, sourceInput);
    return;
  }

  setCartQty(sku, qty);
  syncQtyEverywhere(sku, qty, sourceInput);
}

function setQtyFinal(sku, value){
  if(branchNames.length > 0 && getCartQty(sku) > 0){
    syncQtyEverywhere(sku, getCartQty(sku) || "", null);
    openBranchQuantityEditor(sku);
    return;
  }

  if(String(value || "").trim() === ""){
    delete cart[sku];
  }else{
    setCartQty(sku, value);
  }

  renderCart();
  updateProductOrderArea(sku);
  updateCartCountOnly();
}

const SAFE_TAP_MOVE_LIMIT = 10;

function startSafeButtonPress(event){
  event.stopPropagation();
  event.currentTarget._safePress = {
    x: event.clientX,
    y: event.clientY
  };
}

function cancelSafeButtonPress(event){
  event.stopPropagation();
  event.currentTarget._safePress = null;
}

function isSafeButtonTap(event){
  event.preventDefault();
  event.stopPropagation();

  const press = event.currentTarget._safePress;
  event.currentTarget._safePress = null;

  if(!press) return false;

  const dx = Math.abs(event.clientX - press.x);
  const dy = Math.abs(event.clientY - press.y);

  return dx <= SAFE_TAP_MOVE_LIMIT && dy <= SAFE_TAP_MOVE_LIMIT;
}

function finishQtyButtonPress(event, sku, delta){
  if(isSafeButtonTap(event)){
    if(delta === 1 && branchNames.length > 0 && getCartQty(sku) === 0){
      addToCartFromProduct(sku);
    }else if(delta !== 0 && branchNames.length > 0 && getCartQty(sku) > 0){
      openBranchQuantityEditor(sku);
    }else{
      changeQty(sku, delta);
    }
  }
}

function finishRemoveButtonPress(event, sku){
  if(isSafeButtonTap(event)){
    removeItem(sku);
  }
}

function finishCartBranchButtonPress(event, sku){
  if(isSafeButtonTap(event)){
    openBranchQuantityEditor(sku);
  }
}

function renderOrderControls(product){
  const soldOut = isSoldOut(product);
  const sku = getProductSku(product);
  const cartQty = getCartQty(sku);

  if(soldOut){
    return `<button disabled onpointerdown="event.preventDefault(); event.stopPropagation()">Sold Out</button>`;
  }

  if(quickBranchSku === sku && branchNames.length > 0){
    const branches = getCartBranches(sku);
    const buttonLabel = cartQty > 0 ? "Update Cart" : "Add to Cart";
    const rows = branchNames.map(name => `
      <div class="branchQtyRow">
        <label>${escapeHtml(name)}</label>
        <input
          type="number"
          min="0"
          inputmode="numeric"
          value="${branches[name] || ""}"
          data-branch-name="${escapeHtml(name)}"
          placeholder="0"
          onclick="event.stopPropagation()"
          onpointerdown="event.stopPropagation()"
        >
      </div>
    `).join("");

    return `
      <div class="quickBranchDropdown" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()">
        <h4>Branch Qty</h4>
        ${rows}
        <div class="branchEditorActions">
          <button type="button" onclick="event.preventDefault(); event.stopPropagation(); saveQuickBranchDropdown('${escapeJsString(sku)}')">${buttonLabel}</button>
          <button type="button" onclick="event.preventDefault(); event.stopPropagation(); cancelQuickBranchDropdown('${escapeJsString(sku)}')">Cancel</button>
        </div>
      </div>
    `;
  }

  if(cartQty > 0){
    return `
      <div class="qtyControls" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()">
        <button
          onpointerdown="startSafeButtonPress(event)"
          onpointerup="finishQtyButtonPress(event, '${escapeJsString(sku)}', -1)"
          onpointercancel="cancelSafeButtonPress(event)"
          onclick="event.preventDefault(); event.stopPropagation()"
        >-</button>

        <input
          class="qtyInput"
          data-sku="${escapeHtml(sku)}"
          type="number"
          inputmode="numeric"
          min="1"
          value="${cartQty}"
          oninput="setQtyTyping('${escapeJsString(sku)}', this.value, this)"
          onchange="setQtyFinal('${escapeJsString(sku)}', this.value)"
          onclick="event.stopPropagation()"
          onpointerdown="event.stopPropagation()"
        >

        <button
          onpointerdown="startSafeButtonPress(event)"
          onpointerup="finishQtyButtonPress(event, '${escapeJsString(sku)}', 1)"
          onpointercancel="cancelSafeButtonPress(event)"
          onclick="event.preventDefault(); event.stopPropagation()"
        >+</button>
      </div>
    `;
  }

  return `
    <button
      onpointerdown="startSafeButtonPress(event)"
      onpointerup="finishQtyButtonPress(event, '${escapeJsString(sku)}', 1)"
      onpointercancel="cancelSafeButtonPress(event)"
      onclick="event.preventDefault(); event.stopPropagation()"
    >
      Add to Cart
    </button>
  `;
}

function createProductCard(p){
  const card = document.createElement('div');
  card.className = 'card';

  const sku = getProductSku(p);
  card.dataset.sku = sku;
  card.classList.toggle("quickBranchOpen", quickBranchSku === sku && branchNames.length > 0);
  card.onclick = () => openPhotoViewer(sku);

  const rowColor = getProductRowColor(p);

  if(rowColor){
    card.style.backgroundColor = rowColor;
  }

  const brand = getProductDisplayBrand(p);
  const description = getProductDescription(p);
  const price = getProductPrice(p);
  const status = getProductStatus(p);
  const statusBgColor = getStatusBgColor(p);
  const statusFontColor = getStatusFontColor(p);

  let statusStyle = "";

  if(statusBgColor){
    statusStyle += `background-color:${statusBgColor};`;
  }

  if(statusFontColor){
    statusStyle += `color:${statusFontColor};`;
  }

  card.innerHTML = `
    <div class="info">
      <div class="desc">
        ${brand ? `<b class="brandName">${escapeHtml(brand)}</b>` : ''}
        ${escapeHtml(description)}
      </div>

      <div class="discountBox" onclick="event.stopPropagation()">
        <label>DISCOUNT</label>
        <input
          class="discountInput"
          type="text"
          inputmode="decimal"
          placeholder="0%"
          oninput="calculateNett('${escapeJsString(sku)}', this.value)"
        >
      </div>

      <div class="nettBox" onclick="event.stopPropagation()">
        <label>NETT</label>
        <input
          class="nettInput"
          type="text"
          value=""
          readonly
        >
      </div>

      <div class="price">${escapeHtml(price)}</div>

      <div class="stockBox">
        <span class="stock" style="${statusStyle}">${escapeHtml(status)}</span>
      </div>

      <div class="orderArea">
        ${renderOrderControls(p)}
      </div>
    </div>
  `;

  return card;
}

function getNumberFromPrice(value){
  const cleaned = String(value || "")
    .replace(/,/g, "")
    .replace(/[^\d.]/g, "");

  const num = parseFloat(cleaned);

  if(isNaN(num)){
    return 0;
  }

  return num;
}

function getDiscountPercent(value){
  const cleaned = String(value || "")
    .replace("%", "")
    .replace(/[^\d.]/g, "");

  const num = parseFloat(cleaned);

  if(isNaN(num)){
    return 0;
  }

  return num;
}

function calculateNett(sku, discountValue){
  const product = products.find(p => getProductSku(p) === sku);
  const card = cardBySku[sku];

  if(!product || !card){
    return;
  }

  const nettInput = card.querySelector(".nettInput");

  if(!nettInput){
    return;
  }

  const discountText = String(discountValue || "").trim();

  if(discountText === ""){
    nettInput.value = "";
    return;
  }

  const price = getNumberFromPrice(getProductPrice(product));
  const discountPercent = getDiscountPercent(discountText);

  let nett = price - (price * discountPercent / 100);

  if(nett < 0){
    nett = 0;
  }

  nettInput.value = nett.toFixed(2);
}

function resetAllDiscountBoxes(){
  document.querySelectorAll(".discountInput").forEach(input => {
    input.value = "";
  });

  document.querySelectorAll(".nettInput").forEach(input => {
    input.value = "";
  });
}

function updateProductOrderArea(sku){
  const product = products.find(p => getProductSku(p) === sku);
  if(!product) return;

  const card = cardBySku[sku];
  if(!card) return;

  const orderArea = card.querySelector('.orderArea');
  if(!orderArea) return;

  card.classList.toggle("quickBranchOpen", quickBranchSku === sku && branchNames.length > 0);
  orderArea.innerHTML = renderOrderControls(product);
}

function updateAllProductOrderAreas(){
  Object.keys(cardBySku).forEach(sku => {
    updateProductOrderArea(sku);
  });
}

function updateCartCountOnly(){
  const count = Object.keys(cart).reduce((sum, sku) => sum + getCartQty(sku), 0);
  document.getElementById('cartCount').textContent = count;
}

function changeQty(sku, delta){
  if(delta !== 0 && branchNames.length > 0 && getCartQty(sku) > 0){
    openBranchQuantityEditor(sku);
    return;
  }

  if(quickBranchSku === sku){
    quickBranchSku = "";
  }

  const previousQty = getCartQty(sku);
  setCartQty(sku, previousQty + delta);

  renderCart();
  updateProductOrderArea(sku);
  syncQtyEverywhere(sku, getCartQty(sku) || 0, null);
}

function removeItem(sku){
  delete cart[sku];

  if(activeBranchSku === sku){
    activeBranchSku = "";
  }

  if(quickBranchSku === sku){
    quickBranchSku = "";
  }

  renderCart();
  updateProductOrderArea(sku);
  updateCartCountOnly();
}

function renderCart(){
  updateCartCountOnly();
  renderBranchSettingPanel();

  const box = document.getElementById('cartItems');
  box.innerHTML = '';

  Object.keys(cart).forEach(sku => {
    const item = getCartItem(sku);
    const p = products.find(x => getProductSku(x) === sku);

    if(!p) return;
    if(!shouldShowProduct(p)) return;
    if(!item || item.qty <= 0) return;

    const brand = getProductDisplayBrand(p);
    const description = getProductDescription(p);

    const row = document.createElement('div');
    row.className = 'cartRow';
    row.dataset.sku = sku;

    row.innerHTML = `
      <b>${escapeHtml(brand)} ${escapeHtml(description)}</b>
      <small>Order Qty (Pcs):</small>

      <div class="qtyControls">
        <button
          onpointerdown="startSafeButtonPress(event)"
          onpointerup="finishQtyButtonPress(event, '${escapeJsString(sku)}', -1)"
          onpointercancel="cancelSafeButtonPress(event)"
          onclick="event.preventDefault(); event.stopPropagation()"
        >-</button>

        <input
          class="qtyInput"
          data-sku="${escapeHtml(sku)}"
          type="number"
          inputmode="numeric"
          min="1"
          value="${item.qty}"
          oninput="setQtyTyping('${escapeJsString(sku)}', this.value, this)"
          onchange="setQtyFinal('${escapeJsString(sku)}', this.value)"
          onclick="event.stopPropagation()"
          onpointerdown="event.stopPropagation()"
        >

        <button
          onpointerdown="startSafeButtonPress(event)"
          onpointerup="finishQtyButtonPress(event, '${escapeJsString(sku)}', 1)"
          onpointercancel="cancelSafeButtonPress(event)"
          onclick="event.preventDefault(); event.stopPropagation()"
        >+</button>
      </div>

      <div class="cartActionRow">
        <button
          class="branchButton"
          type="button"
          onpointerdown="startSafeButtonPress(event)"
          onpointerup="finishCartBranchButtonPress(event, '${escapeJsString(sku)}')"
          onpointercancel="cancelSafeButtonPress(event)"
          onclick="event.preventDefault(); event.stopPropagation()"
        >Branch</button>
        <button
          class="remove"
          onpointerdown="startSafeButtonPress(event)"
          onpointerup="finishRemoveButtonPress(event, '${escapeJsString(sku)}')"
          onpointercancel="cancelSafeButtonPress(event)"
          onclick="event.preventDefault(); event.stopPropagation()"
        >Remove</button>
      </div>

      ${getBranchPreviewHtml(sku)}
      ${renderBranchSplitPanel(sku)}
    `;

    box.appendChild(row);
  });
}

document.getElementById('cartButton').onclick = () => {
  renderCart();
  document.getElementById('cartPanel').classList.remove('hidden');
};

document.getElementById('closeCart').onclick = () => {
  document.getElementById('cartPanel').classList.add('hidden');
};

document.getElementById('search').addEventListener('input', () => {
  updateClearSearchButton();
  showCachedCategory();
});

document.getElementById('clearSearchButton').onclick = () => {
  document.getElementById('search').value = "";
  updateClearSearchButton();
  showCachedCategory();
};

function updateClearSearchButton(){
  const clearButton = document.getElementById('clearSearchButton');
  const searchValue = document.getElementById('search').value.trim();

  if(searchValue){
    clearButton.classList.remove('hidden');
  }else{
    clearButton.classList.add('hidden');
  }
}

function hardRefreshApp(){
  if(refreshLock) return;

  refreshLock = true;

  cart = {};
  activeBranchSku = "";
  quickBranchSku = "";
  branchSettingOpen = false;

  resetFiltersToAll();
  resetBarsToLeft();

  const searchInput = document.getElementById('search');
  if(searchInput){
    searchInput.value = "";
  }

  updateClearSearchButton();

  const cartPanel = document.getElementById('cartPanel');
  if(cartPanel){
    cartPanel.classList.add('hidden');
  }

  closePhotoViewer();

  resetAllDiscountBoxes();

  Object.keys(cardBySku).forEach(sku => {
    delete cart[sku];
    updateProductOrderArea(sku);
  });

  renderCart();
  updateCartCountOnly();
  updateActiveButtons();
  showCachedCategory();
  goBackToTop();
  resetBarsToLeft();

  setTimeout(() => {
    resetBarsToLeft();
    goBackToTop();
    updateCartCountOnly();
    refreshLock = false;
  }, 350);
}

const refreshButton = document.getElementById('refreshAppButton');
const branchSettingButton = document.getElementById("branchSettingButton");

if(refreshButton){
  refreshButton.addEventListener('pointerdown', function(event){
    event.preventDefault();
    event.stopPropagation();
    hardRefreshApp();
  });

  refreshButton.addEventListener('click', function(event){
    event.preventDefault();
    event.stopPropagation();
    hardRefreshApp();
  });
}

if(branchSettingButton){
  branchSettingButton.addEventListener("click", function(event){
    event.preventDefault();
    event.stopPropagation();
    openBranchSettings();
  });
}

document.getElementById('sendWhatsapp').onclick = () => {
  if(!customerPhone || !isValidWhatsappNumber(customerPhone)){
    alert("Please login with a valid WhatsApp number first.");
    return;
  }

  if(Object.keys(cart).length === 0){
    alert("Cart is empty.");
    return;
  }

  let totalOrder = 0;
  const lines = [
    "TYRE ONE Order",
    `Customer: ${customerName}`,
    ""
  ];

  const validEntries = Object.keys(cart)
    .map(sku => ({ sku, item: getCartItem(sku), product: products.find(p => getProductSku(p) === sku) }))
    .filter(entry => entry.item && entry.item.qty > 0 && entry.product && shouldShowProduct(entry.product));

  for(let i = 0; i < validEntries.length; i++){
    const { sku, item, product } = validEntries[i];
    const brandUsed = getProductDisplayBrand(product);
    const description = getProductDescription(product);
    const branchUsed = hasBranchSplit(sku);
    const branchTotal = getBranchTotal(sku);

    if(branchUsed && branchTotal !== item.qty){
      alert(`Branch total for ${brandUsed} ${description} is ${branchTotal} PCS, but cart qty is ${item.qty} PCS. Please adjust before sending.`);
      return;
    }

    totalOrder += item.qty;

    lines.push(`Brand: ${brandUsed}`);
    lines.push(`Description: ${description}`);

    if(branchUsed){
      Object.entries(item.branches)
        .filter(([, qty]) => Number(qty) > 0)
        .forEach(([name, qty]) => {
          lines.push(`${name}: ${qty} PCS`);
        });
    }else{
      lines.push(`Order Qty (Pcs): ${item.qty}`);
    }

    lines.push("");
  }

  lines.push(`TOTAL ORDER: ${totalOrder} PCS`);

  window.open(`https://wa.me/${customerPhone}?text=${encodeURIComponent(lines.join("\n"))}`, '_blank');

  const oldCartSkus = Object.keys(cart);

  cart = {};
  activeBranchSku = "";
  quickBranchSku = "";
  renderCart();

  oldCartSkus.forEach(sku => {
    updateProductOrderArea(sku);
  });

  document.getElementById('cartPanel').classList.add('hidden');
};

function openPhotoViewer(sku){
  const product = products.find(p => getProductSku(p) === sku);

  if(!product) return;

  const photoUrl = getProductPhotoUrl(product);

  if(!photoUrl){
    return;
  }

  document.getElementById('viewerTitle').textContent =
    getProductDisplayBrand(product) + " " + getProductDescription(product);

  document.getElementById('viewerImage').src = photoUrl;

  document.getElementById('photoViewer').classList.remove('hidden');
}

function closePhotoViewer(){
  document.getElementById('photoViewer').classList.add('hidden');
  document.getElementById('viewerImage').src = "";
}

function prevPhoto(){
  return;
}

function nextPhoto(){
  return;
}

function escapeHtml(text){
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeJsString(text){
  return String(text || "")
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'")
    .replaceAll('"', '\\"');
}

function cssEscapeValue(value){
  if(window.CSS && CSS.escape){
    return CSS.escape(value);
  }

  return String(value || "").replace(/"/g, '\\"');
}

document.addEventListener('click', function(e){
  const yearButton = document.getElementById('yearButton');
  const yearDropdown = document.getElementById('yearDropdown');

  if(!yearButton || !yearDropdown) return;

  if(
    !yearButton.contains(e.target) &&
    !yearDropdown.contains(e.target)
  ){
    yearDropdown.classList.add('hidden');
  }
});

const topTapZone = document.getElementById("topTapZone");

if(topTapZone){
  topTapZone.addEventListener("pointerdown", function(event){
    event.preventDefault();
    event.stopPropagation();
    goBackToTop();
  });
}

/* EXTRA IPHONE DOUBLE-TAP ZOOM PROTECTION */
let lastTouchEndTime = 0;

document.addEventListener('touchend', function(event){
  const now = Date.now();

  const target = event.target;
  const isInput =
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT";

  if(!isInput && now - lastTouchEndTime <= 300){
    event.preventDefault();
  }

  lastTouchEndTime = now;
}, { passive:false });

checkLogin();
resetFiltersToAll();
ensureInteractionStyleFixes();
loadBranchNames();
ensureAplusVietnamCategoryButton();
resetBarsToLeft();
loadProducts();

setInterval(autoRefreshProducts, 60000);

window.addEventListener('pageshow', function(){
  ensureInteractionStyleFixes();
  ensureAplusVietnamCategoryButton();
  resetBarsToLeft();
});
