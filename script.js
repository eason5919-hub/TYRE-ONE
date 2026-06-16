let products = [];
let cart = {};
let currentCategory = "ALL";
let currentYearFilter = "";
let currentSizeFilter = "";
let customerPhone = "";
let customerName = "";
let branchNames = [];
let branchQuantitiesBySku = {};
let activeBranchEditorSku = "";

let categoryCardCache = {};
let cardBySku = {};

let latestProductsJsonText = "";
let refreshLock = false;
const APP_ASSET_VERSION = "202606161745";
const BRANCH_NAMES_STORAGE_KEY = "tyreOneBranchNames";

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

    body.branchSettingsOpen {
      overflow: hidden;
    }

    .branchSettingsModal {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      z-index: 99999;
    }

    .branchSettingsBox {
      width: min(460px, 100%);
      background: white;
      border-radius: 16px;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.2);
      padding: 18px;
    }

    .branchSettingsHeader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }

    .branchSettingsHeader h3 {
      margin: 0;
    }

    .branchSettingsBox p {
      margin: 0 0 10px;
      color: #555;
      font-size: 13px;
    }

    #branchNamesInput {
      width: 100%;
      min-height: 150px;
      border: 1px solid #d0d0d0;
      border-radius: 12px;
      padding: 12px;
      font: inherit;
      resize: vertical;
    }

    .branchSettingsActions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 14px;
    }

    .branchEditor {
      margin-top: 10px;
      padding: 12px;
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .branchEditorHint {
      font-size: 12px;
      color: #555;
      line-height: 1.4;
    }

    .branchEditorRow {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .branchEditorRow label {
      flex: 1 1 auto;
      font-size: 13px;
      font-weight: 700;
      word-break: break-word;
    }

    .branchEditorRow input {
      width: 88px;
      min-width: 88px;
      padding: 8px 10px;
      border: 1px solid #d0d0d0;
      border-radius: 10px;
      text-align: center;
      font-weight: 700;
    }

    .branchEditorActions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .branchEditorActions button {
      flex: 1 1 0;
    }

    .branchSummary {
      margin-top: 6px;
      font-size: 12px;
      line-height: 1.4;
      color: #555;
      word-break: break-word;
    }

    .qtyInput.branchManaged {
      cursor: pointer;
    }

    @media (max-width: 800px) {
      .branchSettingsModal {
        align-items: flex-start;
        padding: 18px 14px;
      }

      .branchSettingsBox {
        margin-top: 28px;
      }

      .branchEditorRow input {
        width: 76px;
        min-width: 76px;
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
        delete branchQuantitiesBySku[sku];

        if(activeBranchEditorSku === sku){
          activeBranchEditorSku = "";
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

function hasBranchNamesConfigured(){
  return branchNames.length > 0;
}

function getBranchQuantitiesForSku(sku){
  return branchQuantitiesBySku[sku] || {};
}

function hasBranchQuantities(sku){
  return getBranchQtyTotal(getBranchQuantitiesForSku(sku)) > 0;
}

function shouldUseBranchEditorForSku(){
  return hasBranchNamesConfigured();
}

function updateBranchSettingsButton(){
  const button = document.getElementById("branchSettingsButton");

  if(!button) return;

  if(branchNames.length > 0){
    button.textContent = `Branches (${branchNames.length})`;
  }else{
    button.textContent = "Branches";
  }
}

function loadBranchNames(){
  try{
    const raw = localStorage.getItem(BRANCH_NAMES_STORAGE_KEY);
    branchNames = sanitizeBranchNames(JSON.parse(raw || "[]"));
  }catch(err){
    branchNames = [];
  }

  updateBranchSettingsButton();
}

function persistBranchNames(){
  localStorage.setItem(BRANCH_NAMES_STORAGE_KEY, JSON.stringify(branchNames));
  updateBranchSettingsButton();
}

function getBranchNamesFromText(text){
  return sanitizeBranchNames(
    String(text || "")
      .split(/\r?\n|,/)
      .map(name => name.trim())
  );
}

function reconcileBranchDataAfterBranchNameChange(){
  if(!hasBranchNamesConfigured()){
    branchQuantitiesBySku = {};
    activeBranchEditorSku = "";
    return;
  }

  const nextBranchQuantities = {};

  Object.entries(branchQuantitiesBySku).forEach(([sku, branchMap]) => {
    const nextMap = {};
    let movedQty = 0;

    Object.entries(branchMap || {}).forEach(([branchName, qty]) => {
      const parsedQty = parsePositiveInteger(qty);

      if(parsedQty <= 0){
        return;
      }

      if(branchNames.includes(branchName)){
        nextMap[branchName] = parsedQty;
      }else{
        movedQty += parsedQty;
      }
    });

    if(movedQty > 0 && branchNames[0]){
      nextMap[branchNames[0]] = (nextMap[branchNames[0]] || 0) + movedQty;
    }

    const total = getBranchQtyTotal(nextMap);

    if(total > 0){
      nextBranchQuantities[sku] = nextMap;
      cart[sku] = total;
    }
  });

  branchQuantitiesBySku = nextBranchQuantities;
}

function getBranchEditorValues(sku){
  const values = {};
  const saved = getBranchQuantitiesForSku(sku);
  let hasSavedQty = false;

  branchNames.forEach(branchName => {
    const qty = parsePositiveInteger(saved[branchName]);

    if(qty > 0){
      hasSavedQty = true;
      values[branchName] = qty;
    }else{
      values[branchName] = 0;
    }
  });

  if(!hasSavedQty && branchNames[0] && (cart[sku] || 0) > 0){
    values[branchNames[0]] = cart[sku];
  }

  return values;
}

function setBranchQuantitiesForSku(sku, branchMap){
  if(!hasBranchNamesConfigured()){
    delete branchQuantitiesBySku[sku];
    return;
  }

  const nextMap = {};

  branchNames.forEach(branchName => {
    const qty = parsePositiveInteger(branchMap[branchName]);

    if(qty > 0){
      nextMap[branchName] = qty;
    }
  });

  const total = getBranchQtyTotal(nextMap);

  if(total <= 0){
    delete cart[sku];
    delete branchQuantitiesBySku[sku];
    return;
  }

  cart[sku] = total;
  branchQuantitiesBySku[sku] = nextMap;
}

function getBranchSummaryText(sku){
  return branchNames
    .map(branchName => {
      const qty = parsePositiveInteger(getBranchQuantitiesForSku(sku)[branchName]);

      if(qty <= 0){
        return "";
      }

      return `${branchName}: ${qty}`;
    })
    .filter(Boolean)
    .join(" | ");
}

function getStickyHeaderOffset(){
  let offset = 12;
  const elements = [
    document.getElementById("mainHeader"),
    document.getElementById("brandCategoryBar") || document.querySelector(".categoryMenu")
  ];

  elements.forEach(el => {
    if(!el) return;

    const rect = el.getBoundingClientRect();

    if(rect.bottom > 0){
      offset = Math.max(offset, rect.bottom + 12);
    }
  });

  return offset;
}

function scrollCardIntoView(sku){
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

    const rect = card.getBoundingClientRect();
    const top = window.scrollY + rect.top - getStickyHeaderOffset();

    window.scrollTo({
      top: Math.max(top, 0),
      behavior: "smooth"
    });
  };

  requestAnimationFrame(scrollToCard);
  setTimeout(scrollToCard, 220);
}

function openBranchSettings(){
  const modal = document.getElementById("branchSettingsModal");
  const input = document.getElementById("branchNamesInput");

  if(!modal || !input){
    return;
  }

  input.value = branchNames.join("\n");
  modal.classList.remove("hidden");
  document.body.classList.add("branchSettingsOpen");

  setTimeout(() => {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, 30);
}

function closeBranchSettings(){
  const modal = document.getElementById("branchSettingsModal");

  if(modal){
    modal.classList.add("hidden");
  }

  document.body.classList.remove("branchSettingsOpen");
}

function saveBranchSettings(){
  const input = document.getElementById("branchNamesInput");

  if(!input){
    return;
  }

  branchNames = getBranchNamesFromText(input.value);
  persistBranchNames();
  reconcileBranchDataAfterBranchNameChange();
  closeBranchSettings();
  renderCart();

  Object.keys(cardBySku).forEach(sku => {
    updateProductOrderArea(sku);
    syncQtyEverywhere(sku, cart[sku] || "", null);
  });
}

function openBranchEditor(sku, options = {}){
  if(!shouldUseBranchEditorForSku(sku)){
    return;
  }

  const previousSku = activeBranchEditorSku;
  activeBranchEditorSku = sku;

  if(options.closeCart){
    const cartPanel = document.getElementById("cartPanel");

    if(cartPanel){
      cartPanel.classList.add("hidden");
    }
  }

  if(previousSku && previousSku !== sku){
    updateProductOrderArea(previousSku);
  }

  updateProductOrderArea(sku);

  if(options.scroll !== false){
    scrollCardIntoView(sku);
  }
}

function cancelBranchEditor(sku){
  if(activeBranchEditorSku !== sku){
    return;
  }

  activeBranchEditorSku = "";
  updateProductOrderArea(sku);
  syncQtyEverywhere(sku, cart[sku] || "", null);
  scrollCardIntoView(sku);
}

function saveBranchEditor(sku){
  const card = cardBySku[sku];

  if(!card){
    return;
  }

  const nextMap = {};

  card.querySelectorAll(".branchQtyInput").forEach(input => {
    const branchName = cleanValue(input.dataset.branchName);
    nextMap[branchName] = input.value;
  });

  setBranchQuantitiesForSku(sku, nextMap);
  activeBranchEditorSku = "";

  renderCart();
  updateProductOrderArea(sku);
  syncQtyEverywhere(sku, cart[sku] || "", null);
  updateCartCountOnly();
  scrollCardIntoView(sku);
}

function openBranchEditorFromCart(sku){
  openBranchEditor(sku, {
    closeCart: true,
    scroll: true
  });
}

function renderBranchEditor(sku){
  const values = getBranchEditorValues(sku);

  const rows = branchNames.map(branchName => {
    const qty = parsePositiveInteger(values[branchName]);

    return `
      <div class="branchEditorRow">
        <label>${escapeHtml(branchName)}</label>
        <input
          class="branchQtyInput"
          data-branch-name="${escapeHtml(branchName)}"
          type="number"
          inputmode="numeric"
          min="0"
          value="${qty > 0 ? qty : ""}"
          onclick="event.stopPropagation()"
          onpointerdown="event.stopPropagation()"
        >
      </div>
    `;
  }).join("");

  return `
    <div class="branchEditor" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()">
      <div class="branchEditorHint">Set quantity for each branch, then save to update the total cart quantity.</div>
      ${rows}
      <div class="branchEditorActions">
        <button type="button" onclick="event.preventDefault(); event.stopPropagation(); cancelBranchEditor('${escapeJsString(sku)}')">Cancel</button>
        <button type="button" onclick="event.preventDefault(); event.stopPropagation(); saveBranchEditor('${escapeJsString(sku)}')">Save</button>
      </div>
    </div>
  `;
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
  branchQuantitiesBySku = {};
  activeBranchEditorSku = "";
  renderCart();

  document.getElementById('loginError').textContent = "";
  document.getElementById('loginScreen').classList.add('hidden');

  renderAndStayTop();
};

document.getElementById('logoutButton').onclick = () => {
  localStorage.removeItem("customerName");
  localStorage.removeItem("customerPhone");

  customerName = "";
  customerPhone = "";
  cart = {};
  branchQuantitiesBySku = {};
  activeBranchEditorSku = "";

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
  if(shouldUseBranchEditorForSku(sku)){
    syncQtyEverywhere(sku, cart[sku] || "", sourceInput);
    openBranchEditor(sku);
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

  cart[sku] = qty;
  syncQtyEverywhere(sku, qty, sourceInput);
}

function setQtyFinal(sku, value){
  if(shouldUseBranchEditorForSku(sku)){
    syncQtyEverywhere(sku, cart[sku] || "", null);
    openBranchEditor(sku);
    return;
  }

  let qty = parseInt(value, 10);

  if(isNaN(qty) || qty <= 0){
    delete cart[sku];
  }else{
    cart[sku] = qty;
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
    if(shouldUseBranchEditorForSku(sku)){
      openBranchEditor(sku);
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
    openBranchEditorFromCart(sku);
  }
}

function renderOrderControls(product){
  const soldOut = isSoldOut(product);
  const sku = getProductSku(product);
  const cartQty = cart[sku] || 0;
  const branchMode = shouldUseBranchEditorForSku(sku);

  if(soldOut){
    return `<button disabled onpointerdown="event.preventDefault(); event.stopPropagation()">Sold Out</button>`;
  }

  if(branchMode){
    let controls = "";

    if(cartQty > 0){
      controls = `
        <div class="qtyControls" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()">
          <button
            onpointerdown="startSafeButtonPress(event)"
            onpointerup="finishQtyButtonPress(event, '${escapeJsString(sku)}', -1)"
            onpointercancel="cancelSafeButtonPress(event)"
            onclick="event.preventDefault(); event.stopPropagation()"
          >-</button>

          <input
            class="qtyInput branchManaged"
            data-sku="${escapeHtml(sku)}"
            type="number"
            inputmode="numeric"
            min="1"
            readonly
            value="${cartQty}"
            onclick="event.stopPropagation(); openBranchEditor('${escapeJsString(sku)}')"
            onfocus="this.blur(); openBranchEditor('${escapeJsString(sku)}')"
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
    }else{
      controls = `
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

    const summary = hasBranchQuantities(sku)
      ? `<div class="branchSummary">${escapeHtml(getBranchSummaryText(sku))}</div>`
      : "";

    const editor = activeBranchEditorSku === sku
      ? renderBranchEditor(sku)
      : "";

    return controls + summary + editor;
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

  orderArea.innerHTML = renderOrderControls(product);
}

function updateCartCountOnly(){
  const count = Object.values(cart).reduce((a,b) => a + b, 0);
  document.getElementById('cartCount').textContent = count;
}

function changeQty(sku, delta){
  if(shouldUseBranchEditorForSku(sku)){
    openBranchEditor(sku);
    return;
  }

  cart[sku] = (cart[sku] || 0) + delta;

  if(cart[sku] <= 0){
    delete cart[sku];
  }

  renderCart();
  updateProductOrderArea(sku);
  syncQtyEverywhere(sku, cart[sku] || 0, null);
}

function removeItem(sku){
  delete cart[sku];
  delete branchQuantitiesBySku[sku];

  if(activeBranchEditorSku === sku){
    activeBranchEditorSku = "";
  }

  renderCart();
  updateProductOrderArea(sku);
  updateCartCountOnly();
}

function renderCart(){
  updateCartCountOnly();

  const box = document.getElementById('cartItems');
  box.innerHTML = '';

  Object.entries(cart).forEach(([sku, qty]) => {
    const p = products.find(x => getProductSku(x) === sku);

    if(!p) return;
    if(!shouldShowProduct(p)) return;

    const brand = getProductDisplayBrand(p);
    const description = getProductDescription(p);

    const row = document.createElement('div');
    row.className = 'cartRow';

    const branchMode = shouldUseBranchEditorForSku(sku);

    row.innerHTML = branchMode ? `
      <b>${escapeHtml(brand)} ${escapeHtml(description)}</b>
      <small>Order Qty (Pcs):</small>

      <div class="qtyControls">
        <button
          onpointerdown="startSafeButtonPress(event)"
          onpointerup="finishCartBranchButtonPress(event, '${escapeJsString(sku)}')"
          onpointercancel="cancelSafeButtonPress(event)"
          onclick="event.preventDefault(); event.stopPropagation()"
        >-</button>

        <input
          class="qtyInput branchManaged"
          data-sku="${escapeHtml(sku)}"
          type="number"
          inputmode="numeric"
          min="1"
          readonly
          value="${qty}"
          onclick="event.stopPropagation(); openBranchEditorFromCart('${escapeJsString(sku)}')"
          onfocus="this.blur(); openBranchEditorFromCart('${escapeJsString(sku)}')"
          onpointerdown="event.stopPropagation()"
        >

        <button
          onpointerdown="startSafeButtonPress(event)"
          onpointerup="finishCartBranchButtonPress(event, '${escapeJsString(sku)}')"
          onpointercancel="cancelSafeButtonPress(event)"
          onclick="event.preventDefault(); event.stopPropagation()"
        >+</button>
        <button
          class="remove"
          onpointerdown="startSafeButtonPress(event)"
          onpointerup="finishRemoveButtonPress(event, '${escapeJsString(sku)}')"
          onpointercancel="cancelSafeButtonPress(event)"
          onclick="event.preventDefault(); event.stopPropagation()"
        >Remove</button>
      </div>

      ${hasBranchQuantities(sku) ? `<small class="branchSummary">${escapeHtml(getBranchSummaryText(sku))}</small>` : ""}
    ` : `
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
          value="${qty}"
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
        <button
          class="remove"
          onpointerdown="startSafeButtonPress(event)"
          onpointerup="finishRemoveButtonPress(event, '${escapeJsString(sku)}')"
          onpointercancel="cancelSafeButtonPress(event)"
          onclick="event.preventDefault(); event.stopPropagation()"
        >Remove</button>
      </div>
    `;

    box.appendChild(row);
  });
}

document.getElementById('cartButton').onclick = () => {
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
  branchQuantitiesBySku = {};
  activeBranchEditorSku = "";

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
const branchSettingsButton = document.getElementById("branchSettingsButton");
const branchSettingsModal = document.getElementById("branchSettingsModal");
const closeBranchSettingsButton = document.getElementById("closeBranchSettingsButton");
const cancelBranchesButton = document.getElementById("cancelBranchesButton");
const clearBranchesButton = document.getElementById("clearBranchesButton");
const saveBranchesButton = document.getElementById("saveBranchesButton");

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

if(branchSettingsButton){
  branchSettingsButton.addEventListener("click", function(event){
    event.preventDefault();
    event.stopPropagation();
    openBranchSettings();
  });
}

if(closeBranchSettingsButton){
  closeBranchSettingsButton.addEventListener("click", function(event){
    event.preventDefault();
    event.stopPropagation();
    closeBranchSettings();
  });
}

if(cancelBranchesButton){
  cancelBranchesButton.addEventListener("click", function(event){
    event.preventDefault();
    event.stopPropagation();
    closeBranchSettings();
  });
}

if(clearBranchesButton){
  clearBranchesButton.addEventListener("click", function(event){
    event.preventDefault();
    event.stopPropagation();

    const input = document.getElementById("branchNamesInput");

    if(input){
      input.value = "";
      input.focus();
    }
  });
}

if(saveBranchesButton){
  saveBranchesButton.addEventListener("click", function(event){
    event.preventDefault();
    event.stopPropagation();
    saveBranchSettings();
  });
}

if(branchSettingsModal){
  branchSettingsModal.addEventListener("click", function(event){
    if(event.target === branchSettingsModal){
      closeBranchSettings();
    }
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

  let message = `TYRE ONE Order%0A`;
  message += `Customer: ${encodeURIComponent(customerName)}%0A%0A`;

  let totalOrder = 0;

  Object.entries(cart).forEach(([sku, qty]) => {
    const p = products.find(x => getProductSku(x) === sku);

    if(!p) return;
    if(!shouldShowProduct(p)) return;

    const brand = getProductDisplayBrand(p);
    const description = getProductDescription(p);

    totalOrder += qty;

    message += `Brand: ${encodeURIComponent(brand)}%0A`;
    message += `Description: ${encodeURIComponent(description)}%0A`;
    message += `Order Qty (Pcs): ${qty}%0A`;

    if(hasBranchQuantities(sku)){
      message += `Branch Qty:%0A`;

      branchNames.forEach(branchName => {
        const branchQty = parsePositiveInteger(getBranchQuantitiesForSku(sku)[branchName]);

        if(branchQty > 0){
          message += `${encodeURIComponent(branchName + ": " + branchQty)}%0A`;
        }
      });
    }

    message += `%0A`;
  });

  message += `TOTAL ORDER: ${totalOrder} PCS%0A`;

  const url = `https://wa.me/${customerPhone}?text=${message}`;

  window.open(url, '_blank');

  cart = {};
  branchQuantitiesBySku = {};
  activeBranchEditorSku = "";
  renderCart();

  Object.keys(cardBySku).forEach(sku => {
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
  updateBranchSettingsButton();
  ensureAplusVietnamCategoryButton();
  resetBarsToLeft();
});
