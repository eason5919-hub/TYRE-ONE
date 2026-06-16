let products = [];
let cart = {};
let currentCategory = "ALL";
let currentYearFilter = "";
let currentSizeFilter = "";
let customerPhone = "";
let customerName = "";

let categoryCardCache = {};
let cardBySku = {};

let latestProductsJsonText = "";
let refreshLock = false;

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
      }
    });

    renderCart();
    showCachedCategory();
    updateCartCountOnly();

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

    const brand = getProductBrand(p);
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

function getProductSku(product){
  return cleanValue(product.__sku);
}

function getProductBrand(product){
  return cleanValue(
    product["Brand"] ||
    product["BRAND"] ||
    product["brand"]
  ).toUpperCase();
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
  const brand = getProductBrand(product);
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

  const brand = getProductBrand(product);
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
      ${getProductBrand(p)}
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
    changeQty(sku, delta);
  }
}

function finishRemoveButtonPress(event, sku){
  if(isSafeButtonTap(event)){
    removeItem(sku);
  }
}

function renderOrderControls(product){
  const soldOut = isSoldOut(product);
  const sku = getProductSku(product);
  const cartQty = cart[sku] || 0;

  if(soldOut){
    return `<button disabled onpointerdown="event.preventDefault(); event.stopPropagation()">Sold Out</button>`;
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

  const brand = getProductBrand(p);
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

    const brand = getProductBrand(p);
    const description = getProductDescription(p);

    const row = document.createElement('div');
    row.className = 'cartRow';

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

    const brand = getProductBrand(p);
    const description = getProductDescription(p);

    totalOrder += qty;

    message += `Brand: ${encodeURIComponent(brand)}%0A`;
    message += `Description: ${encodeURIComponent(description)}%0A`;
    message += `Order Qty (Pcs): ${qty}%0A`;
    message += `%0A`;
  });

  message += `TOTAL ORDER: ${totalOrder} PCS%0A`;

  const url = `https://wa.me/${customerPhone}?text=${message}`;

  window.open(url, '_blank');

  cart = {};
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
    getProductBrand(product) + " " + getProductDescription(product);

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
loadProducts();

setInterval(autoRefreshProducts, 60000);
