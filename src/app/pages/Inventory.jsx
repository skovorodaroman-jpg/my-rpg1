
<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#100d09">
<title>Інвентар RPG</title>
<style>
:root{--bg:#100d09;--panel:#1d1811;--gold:#d8ad53;--light:#f4d98f;--border:#614a25;--text:#e8dfcd;--muted:#9b907c;--blue:#79bdff;--purple:#c39aff;--green:#8ad09a;--red:#ed8b7a}
*{box-sizing:border-box}
body{margin:0;background:radial-gradient(ellipse at top,#302313 0%,#100d09 60%);color:var(--text);font-family:Georgia,"Times New Roman",serif;min-height:100vh}
button{font:inherit;cursor:pointer}
button:focus-visible{outline:2px solid var(--light);outline-offset:2px}
.app{width:min(100%,760px);margin:auto;padding:12px 12px 35px}
.header,.hero,.section,.admin{border:1px solid var(--border);border-radius:8px;background:linear-gradient(145deg,#251e14,#15110d);box-shadow:0 5px 18px #0004}
.header{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:14px}
.brand{font-size:17px;font-weight:bold;color:var(--light)}
.subtitle{font-size:11px;color:var(--muted);margin-top:5px}
.gold{white-space:nowrap;color:var(--light);font-weight:bold}
.hero{display:flex;align-items:center;gap:12px;margin:12px 0;padding:12px}
.avatar{width:48px;height:48px;display:grid;place-items:center;font-size:27px;border:1px solid var(--gold);border-radius:6px;background:#302416}
.hero-name{color:var(--light);font-weight:bold}
.hero-info{font-size:12px;color:var(--muted);margin-top:5px}
.tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0}
.tab{padding:13px 8px;border:1px solid var(--border);border-radius:6px;color:#c5b58e;background:linear-gradient(#2c2418,#17120d);font-weight:bold}
.tab.active{color:#fff0c4;border-color:var(--gold);background:linear-gradient(#684a1f,#322213)}
.section,.admin{padding:14px;margin-top:12px}
.heading{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:13px}
h1{font-size:22px;margin:0;color:var(--light)}
.desc{font-size:12px;line-height:1.5;color:var(--muted);margin-top:5px}
.capacity{font-size:12px;color:var(--gold);white-space:nowrap;text-align:right}
.capacity strong{display:block;font-size:17px;margin-top:3px}
.progress{height:5px;background:#0a0806;border-radius:6px;overflow:hidden;margin-bottom:14px}
.progress-fill{height:100%;width:0;background:linear-gradient(90deg,#95702b,#f5d87d);transition:width .2s}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
.item{min-width:0;padding:10px;border:1px solid #55452f;border-radius:7px;background:linear-gradient(145deg,#2a2218,#17130f)}
.item.common{border-color:#655b4c}
.item.rare{border-color:#477ba4}
.item.legendary{border-color:#ad8337;box-shadow:inset 0 0 14px #d9ac3610}
.item-top{display:flex;gap:9px;align-items:center;min-height:47px;margin-bottom:9px}
.item-icon{width:44px;height:44px;flex-shrink:0;display:grid;place-items:center;border:1px solid #55452d;border-radius:5px;background:#100d09;font-size:25px}
.item-name{font-size:13px;font-weight:bold;line-height:1.35;overflow-wrap:anywhere}
.rarity{display:block;font-size:11px;margin-top:4px}
.common .rarity{color:#c2b8a5}.rare .rarity{color:var(--blue)}.legendary .rarity{color:var(--light)}
.equipped{display:inline-block;font-size:10px;color:var(--green);border:1px solid #45694b;border-radius:3px;padding:3px 5px;margin-bottom:7px}
.item-footer{display:flex;justify-content:space-between;align-items:center;gap:5px;padding-top:8px;border-top:1px solid #413524}
.price{font-size:11px;color:var(--light);white-space:nowrap}
.btn{padding:8px 9px;color:#f8e9c4;border:1px solid #80602c;border-radius:4px;background:linear-gradient(#654b24,#332315);font-size:11px}
.btn:hover,.tab:hover{filter:brightness(1.2)}
.btn.red{color:#ffc0b4;border-color:#794439;background:linear-gradient(#552b22,#2c1713)}
.btn.green{border-color:#426b48;background:linear-gradient(#315237,#17291a)}
.empty{grid-column:1/-1;text-align:center;padding:30px 12px;border:1px dashed #4b3b25;border-radius:7px;background:#100d0988}
.empty-icon{font-size:34px;margin-bottom:9px}
.empty-title{color:var(--light);font-size:15px}
.empty-text{max-width:280px;margin:7px auto 0;font-size:12px;color:var(--muted);line-height:1.5}
.toolbar{display:flex;gap:7px;flex-wrap:wrap;margin-top:13px}
.toolbar .btn{font-size:12px}
.admin-title{font-size:14px;color:var(--light);font-weight:bold}
.admin-desc{font-size:11px;color:var(--muted);margin-top:5px;line-height:1.5}
.admin .toolbar{margin-top:10px}
.hidden{display:none!important}
.toast{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);width:max-content;max-width:calc(100% - 30px);padding:11px 16px;border:1px solid var(--gold);border-radius:6px;background:#21180e;color:var(--light);font-size:13px;box-shadow:0 5px 20px #0009;z-index:5;text-align:center}
footer{text-align:center;font-size:11px;color:#766953;padding:20px 8px 0;line-height:1.8}
@media(max-width:390px){.app{padding:8px}.section,.admin{padding:10px}.grid{gap:7px}.item{padding:8px}.item-icon{width:38px;height:38px;font-size:22px}.item-footer{align-items:flex-start;flex-direction:column}.item-footer .btn{width:100%}.brand{font-size:14px}.gold{font-size:12px}}
</style>
</head>
<body>
<div class="app">
  <header class="header">
    <div>
      <div class="brand">⚔ Хроніки Згаслого Світанку</div>
      <div class="subtitle">Сховище мандрівника</div>
    </div>
    <div class="gold">🪙 <span id="gold">1000</span></div>
  </header>

  <div class="hero">
    <div class="avatar">🛡️</div>
    <div>
      <div class="hero-name">Мій герой</div>
      <div class="hero-info">Рівень 1 · Шукач пригод</div>
      <div class="hero-info" id="equippedCount">Екіпірування: 0 предметів</div>
    </div>
  </div>

  <nav class="tabs">
    <button class="tab active" id="bagTab" onclick="switchTab('bag')">🎒 Сумка</button>
    <button class="tab" id="chestTab" onclick="switchTab('chest')">📦 Сундук</button>
  </nav>

  <section class="section" id="bagSection">
    <div class="heading">
      <div>
        <h1>🎒 Сумка</h1>
        <div class="desc">Екіпірування та знайдені речі мандрівника.</div>
      </div>
      <div class="capacity">Місткість<strong id="bagCount">0 / 40</strong></div>
    </div>
    <div class="progress"><div class="progress-fill" id="bagProgress"></div></div>
    <div class="grid" id="bagGrid"></div>
    <div class="toolbar">
      <button class="btn red" onclick="sellAll()">Продати всі речі</button>
      <button class="btn" onclick="sellByRarity('common')">Продати звичайні</button>
      <button class="btn" onclick="sellByRarity('rare')">Продати рідкісні</button>
      <button class="btn" onclick="sellByRarity('legendary')">Продати легендарні</button>
    </div>
  </section>

  <section class="section hidden" id="chestSection">
    <div class="heading">
      <div>
        <h1>📦 Сундук</h1>
        <div class="desc">Еліксири, руда, трави та матеріали для ремесла.</div>
      </div>
      <div class="capacity">Предметів<strong id="chestCount">0</strong></div>
    </div>
    <div class="grid" id="chestGrid"></div>
    <div class="toolbar">
      <button class="btn red" onclick="clearChest()">Очистити сундук</button>
    </div>
  </section>

  <section class="admin">
    <div class="admin-title">⚙ Панель тестувальника</div>
    <div class="admin-desc">Перевіряй заповнення сумки, продаж, екіпірування та зберігання ресурсів.</div>
    <div class="toolbar">
      <button class="btn" onclick="addRandomItem()">＋ Додати випадкову річ у Сумку</button>
      <button class="btn" onclick="addResource()">＋ Додати ресурс у Сундук</button>
      <button class="btn red" onclick="clearBag()">Очистити Сумку</button>
      <button class="btn red" onclick="clearChest()">Очистити Сундук</button>
    </div>
    <div class="toolbar">
      <button class="btn" onclick="addPotion()">🧪 Додати еліксир</button>
      <button class="btn" onclick="craftPotion()">⚗ Виготовити еліксир</button>
    </div>
  </section>

  <footer>Темрява приховує скарби. Світло ще не згасло…<br>Тестовий інвентар · Дані зберігаються в цьому браузері</footer>
</div>

<div id="toast" class="toast hidden" role="status" aria-live="polite"></div>

<script>
"use strict";

const BAG_LIMIT = 40;

const itemTemplates = [
  {name:"Шолом нежиті",icon:"💀",rarity:"common",price:35,type:"armor"},
  {name:"Рукавиці мандрівника",icon:"🧤",rarity:"common",price:25,type:"armor"},
  {name:"Шкіряні чоботи",icon:"🥾",rarity:"common",price:30,type:"armor"},
  {name:"Старий щит",icon:"🛡️",rarity:"common",price:40,type:"armor"},
  {name:"Іржавий меч",icon:"⚔️",rarity:"common",price:45,type:"weapon"},
  {name:"Плащ вигнанця",icon:"🧥",rarity:"common",price:32,type:"armor"},
  {name:"Перстень мандрівника",icon:"💍",rarity:"common",price:28,type:"accessory"},
  {name:"Амулет попелу",icon:"📿",rarity:"rare",price:110,type:"accessory"},
  {name:"Перчатки асасина",icon:"🥷",rarity:"rare",price:135,type:"armor"},
  {name:"Клинок тіні",icon:"🗡️",rarity:"rare",price:160,type:"weapon"},
  {name:"Срібний шолом",icon:"⛑️",rarity:"rare",price:120,type:"armor"},
  {name:"Чоботи бурі",icon:"👢",rarity:"rare",price:140,type:"armor"},
  {name:"Рунний щит",icon:"🔰",rarity:"rare",price:175,type:"armor"},
  {name:"Корона згаслого короля",icon:"👑",rarity:"legendary",price:550,type:"armor"},
  {name:"Меч світанку",icon:"⚔️",rarity:"legendary",price:700,type:"weapon"},
  {name:"Обладунок безсмертного",icon:"🛡️",rarity:"legendary",price:850,type:"armor"},
  {name:"Перстень вічності",icon:"💍",rarity:"legendary",price:620,type:"accessory"},
  {name:"Посох стародавніх",icon:"🪄",rarity:"legendary",price:760,type:"weapon"}
];

const resourceTemplates = [
  {name:"Залізна руда",icon:"🪨",type:"resource"},
  {name:"Місячна трава",icon:"🌿",type:"resource"},
  {name:"Порожня колба",icon:"⚗️",type:"resource"},
  {name:"Кристал сутінків",icon:"💎",type:"resource"},
  {name:"Чорний гриб",icon:"🍄",type:"resource"},
  {name:"Стародавня руна",icon:"🔮",type:"resource"},
  {name:"Еліксир здоров'я",icon:"🧪",type:"potion"},
  {name:"Еліксир сили",icon:"🍷",type:"potion"},
  {name:"Світлова есенція",icon:"✨",type:"resource"}
];

let bag = [];
let chest = [];
let gold = 1000;
let nextId = 1;
let toastTimer;

const rarityLabels = {
  common:"Звичайний",
  rare:"Рідкісний",
  legendary:"Легендарний"
};

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 2600);
}

function save() {
  try {
    localStorage.setItem("chronicles_inventory_v1", JSON.stringify({
      bag, chest, gold, nextId
    }));
  } catch (error) {
    console.warn("Не вдалося зберегти інвентар:", error);
  }
}

function load() {
  try {
    const raw = localStorage.getItem("chronicles_inventory_v1");
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data && Array.isArray(data.bag) && Array.isArray(data.chest)
        && Number.isFinite(data.gold) && Number.isFinite(data.nextId)) {
      bag = data.bag.slice(0, BAG_LIMIT);
      chest = data.chest;
      gold = Math.max(0, data.gold);
      nextId = Math.max(1, data.nextId);
    }
  } catch (error) {
    console.warn("Збережені дані пошкоджені, використано порожній інвентар.", error);
  }
}

function switchTab(tab) {
  const bagActive = tab === "bag";
  document.getElementById("bagSection").classList.toggle("hidden", !bagActive);
  document.getElementById("chestSection").classList.toggle("hidden", bagActive);
  document.getElementById("bagTab").classList.toggle("active", bagActive);
  document.getElementById("chestTab").classList.toggle("active", !bagActive);
}

function addRandomItem() {
  if (bag.length >= BAG_LIMIT) {
    showToast("Сумка заповнена! Максимум — 40 речей.");
    return;
  }
  const item = itemTemplates[Math.floor(Math.random() * itemTemplates.length)];
  bag.push({...item, id:nextId++, equipped:false});
  render();
  showToast("Знайдено предмет: " + item.name);
}

function addResource() {
  const resource = resourceTemplates.filter(item => item.type === "resource");
  const item = resource[Math.floor(Math.random() * resource.length)];
  chest.push({...item, id:nextId++, quantity:1});
  render();
  showToast("У сундук додано: " + item.name);
}

function addPotion() {
  const potions = resourceTemplates.filter(item => item.type === "potion");
  const item = potions[Math.floor(Math.random() * potions.length)];
  chest.push({...item, id:nextId++, quantity:1});
  render();
  showToast("Еліксир збережено в сундуку.");
}

function craftPotion() {
  const herbIndex = chest.findIndex(item => item.name === "Місячна трава");
  const vialIndex = chest.findIndex(item => item.name === "Порожня колба");

  if (herbIndex === -1 || vialIndex === -1) {
    showToast("Потрібні Місячна трава та Порожня колба!");
    return;
  }

  chest.splice(Math.max(herbIndex, vialIndex), 1);
  chest.splice(Math.min(herbIndex, vialIndex), 1);
  chest.push({
    name:"Еліксир здоров'я",
    icon:"🧪",
    type:"potion",
    id:nextId++,
    quantity:1
  });
  render();
  switchTab("chest");
  showToast("Еліксир виготовлено та поміщено в сундук!");
}

function equipItem(id) {
  const item = bag.find(item => item.id === id);
  if (!item) return;
  if (item.equipped) {
    item.equipped = false;
    showToast("Предмет знято: " + item.name);
  } else {
    item.equipped = true;
    showToast("Надягнуто: " + item.name);
  }
  render();
}

function sellItem(id) {
  const index = bag.findIndex(item => item.id === id);
  if (index === -1) return;
  const item = bag[index];
  if (item.equipped) {
    showToast("Спочатку зніми предмет, щоб продати його.");
    return;
  }
  gold += item.price;
  bag.splice(index, 1);
  render();
  showToast("Продано за " + item.price + " монет.");
}

function sellByRarity(rarity) {
  const toSell = bag.filter(item => item.rarity === rarity && !item.equipped);
  if (!toSell.length) {
    showToast("Немає неекіпірованих речей цієї рідкості.");
    return;
  }
  if (!confirm("Продати " + toSell.length + " речей? Екіпіровані речі залишаться.")) return;
  const ids = new Set(toSell.map(item => item.id));
  gold += toSell.reduce((sum, item) => sum + item.price, 0);
  bag = bag.filter(item => !ids.has(item.id));
  render();
  showToast("Продано речей: " + toSell.length);
}

function sellAll() {
  const toSell = bag.filter(item => !item.equipped);
  if (!toSell.length) {
    showToast("Немає речей для продажу.");
    return;
  }
  if (!confirm("Продати всі " + toSell.length + " неекіпірованих речей?")) return;
  gold += toSell.reduce((sum, item) => sum + item.price, 0);
  const ids = new Set(toSell.map(item => item.id));
  bag = bag.filter(item => !ids.has(item.id));
  render();
  showToast("Усі доступні речі продано.");
}

function clearBag() {
  if (!bag.length) {
    showToast("Сумка вже порожня.");
    return;
  }
  if (!confirm("Видалити всі речі із сумки? Це не дасть монет.")) return;
  bag = [];
  render();
  showToast("Сумку очищено.");
}

function clearChest() {
  if (!chest.length) {
    showToast("Сундук уже порожній.");
    return;
  }
  if (!confirm("Видалити всі предмети із сундука?")) return;
  chest = [];
  render();
  showToast("Сундук очищено.");
}

function createEmpty(icon, title, text) {
  const div = document.createElement("div");
  div.className = "empty";
  const iconDiv = document.createElement("div");
  iconDiv.className = "empty-icon";
  iconDiv.textContent = icon;
  const titleDiv = document.createElement("div");
  titleDiv.className = "empty-title";
  titleDiv.textContent = title;
  const textDiv = document.createElement("div");
  textDiv.className = "empty-text";
  textDiv.textContent = text;
  div.append(iconDiv, titleDiv, textDiv);
  return div;
}

function createButton(label, className, handler) {
  const button = document.createElement("button");
  button.className = "btn " + (className || "");
  button.textContent = label;
  button.addEventListener("click", handler);
  return button;
}

function renderBag() {
  const grid = document.getElementById("bagGrid");
  grid.replaceChildren();
  document.getElementById("bagCount").textContent = bag.length + " / " + BAG_LIMIT;
  document.getElementById("bagProgress").style.width = (bag.length / BAG_LIMIT * 100) + "%";
  document.getElementById("equippedCount").textContent =
    "Екіпірування: " + bag.filter(item => item.equipped).length + " предметів";

  if (!bag.length) {
    grid.appendChild(createEmpty("🎒", "Сумка порожня", "Знайди свою першу річ за допомогою панелі тестувальника."));
    return;
  }

  bag.forEach(item => {
    const card = document.createElement("article");
    card.className = "item " + item.rarity;

    const top = document.createElement("div");
    top.className = "item-top";
    const icon = document.createElement("div");
    icon.className = "item-icon";
    icon.textContent = item.icon || "📦";

    const details = document.createElement("div");
    const name = document.createElement("div");
    name.className = "item-name";
    name.textContent = item.name;
    const rarity = document.createElement("span");
    rarity.className = "rarity";
    rarity.textContent = rarityLabels[item.rarity] || "Предмет";
    details.append(name, rarity);
    top.append(icon, details);
    card.appendChild(top);

    if (item.equipped) {
      const badge = document.createElement("div");
      badge.className = "equipped";
      badge.textContent = "✓ НАДІТО";
      card.appendChild(badge);
    }

    const footer = document.createElement("div");
    footer.className = "item-footer";
    const price = document.createElement("span");
    price.className = "price";
    price.textContent = "🪙 " + item.price;
    footer.appendChild(price);

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "5px";

    actions.appendChild(createButton(
      item.equipped ? "Зняти" : "Надіти",
      "green",
      () => equipItem(item.id)
    ));
    actions.appendChild(createButton(
      "Продати",
      "red",
      () => sellItem(item.id)
    ));
    footer.appendChild(actions);
    card.appendChild(footer);
    grid.appendChild(card);
  });
}

function renderChest() {
  const grid = document.getElementById("chestGrid");
  grid.replaceChildren();
  document.getElementById("chestCount").textContent = chest.length;

  if (!chest.length) {
    grid.appendChild(createEmpty("📦", "Сундук порожній", "Зберігай тут знайдені ресурси та виготовлені еліксири."));
    return;
  }

  chest.forEach(item => {
    const card = document.createElement("article");
    card.className = "item common";
    const top = document.createElement("div");
    top.className = "item-top";

    const icon = document.createElement("div");
    icon.className = "item-icon";
    icon.textContent = item.icon || "📦";

    const details = document.createElement("div");
    const name = document.createElement("div");
    name.className = "item-name";
    name.textContent = item.name;
    const type = document.createElement("span");
    type.className = "rarity";
    type.style.color = item.type === "potion" ? "#d3a4ff" : "#9bca9b";
    type.textContent = item.type === "potion" ? "Еліксир" : "Ресурс";
    details.append(name, type);
    top.append(icon, details);
    card.appendChild(top);

    const footer = document.createElement("div");
    footer.className = "item-footer";
    const quantity = document.createElement("span");
    quantity.className = "price";
    quantity.textContent = "Кількість: " + (item.quantity || 1);
    footer.appendChild(quantity);

    footer.appendChild(createButton("Видалити", "red", () => {
      chest = chest.filter(entry => entry.id !== item.id);
      render();
      showToast("Предмет видалено із сундука.");
    }));
    card.appendChild(footer);
    grid.appendChild(card);
  });
}

function render() {
    document.getElementById("gold").textContent = gold.toLocaleString("uk-UA");
  renderBag();
  renderChest();
  save();
}

load();
render();
</script>
</body>
</html>
  
