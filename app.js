document.addEventListener("DOMContentLoaded", () => {
// DEV MODE
const USE_MOCK_DATA = false;

// ---------- CONSTANTES ---------- //
let currentShoppingState = null;
let shoppingIsSorted = false;
const EXCLUDED_CATEGORIES = ["APERO", "BRUNCH"];

// Tous les jours du dimanche au vendredi, matin et soir (pas de samedi)
const DAYS_MEALS = [
  { day: "Dimanche", meal: "midi" },
  { day: "Dimanche", meal: "soir" },
  { day: "Lundi",    meal: "midi" },
  { day: "Lundi",    meal: "soir" },
  { day: "Mardi",    meal: "midi" },
  { day: "Mardi",    meal: "soir" },
  { day: "Mercredi", meal: "midi" },
  { day: "Mercredi", meal: "soir" },
  { day: "Jeudi",    meal: "midi" },
  { day: "Jeudi",    meal: "soir" },
  { day: "Vendredi", meal: "midi" },
  { day: "Vendredi", meal: "soir" },
];

const NUM_WEEKS = 4;

// selectedRecipes[weekIndex][dayIndex] = [recipe, ...]
let selectedRecipes = {};
let excludedRecipeIds = new Set();
let ingredientMap = {};
let allRecipesCache = [];
const popup = document.getElementById("recipe-popup");
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const speechSupported = !!SpeechRecognition;

const MOCK_RECIPES = [
  {
    id: "rec_1",
    icon: { type: "emoji", emoji: "🍝" },
    properties: {
      Nom: { title: [{ plain_text: "Pâtes carbonara" }] },
      Categorie: { multi_select: [{ name: "PLAT" }] },
      Saison: { multi_select: [{ name: "Hiver" }, { name: "Automne" }] },
      Ingredients: [
        { name: "Pâtes" }, { name: "Lardons" }, { name: "Œufs" },
        { name: "Parmesan" }, { name: "Poivre" }
      ]
    }
  },
  {
    id: "rec_2",
    icon: { type: "emoji", emoji: "🥗" },
    properties: {
      Nom: { title: [{ plain_text: "Salade césar" }] },
      Categorie: { multi_select: [{ name: "PLAT" }] },
      Saison: { multi_select: [{ name: "Printemps" }, { name: "Été" }] },
      Ingredients: [
        { name: "Salade romaine" }, { name: "Poulet" }, { name: "Parmesan" },
        { name: "Croûtons" }, { name: "Sauce césar" }
      ]
    }
  },
  {
    id: "rec_3",
    icon: { type: "emoji", emoji: "🍲" },
    properties: {
      Nom: { title: [{ plain_text: "Soupe de légumes" }] },
      Categorie: { multi_select: [{ name: "SOUPE" }] },
      Saison: { multi_select: [{ name: "Hiver" }] },
      Ingredients: [
        { name: "Carottes" }, { name: "Poireaux" },
        { name: "Pommes de terre" }, { name: "Oignon" }
      ]
    }
  },
  {
    id: "rec_4",
    icon: { type: "emoji", emoji: "🍛" },
    properties: {
      Nom: { title: [{ plain_text: "Curry de pois chiches" }] },
      Categorie: { multi_select: [{ name: "PLAT" }] },
      Saison: { multi_select: [{ name: "Automne" }, { name: "Hiver" }] },
      Ingredients: [
        { name: "Pois chiches" }, { name: "Lait de coco" },
        { name: "Curry" }, { name: "Oignon" }, { name: "Riz" }
      ]
    }
  },
  {
    id: "rec_5",
    icon: { type: "emoji", emoji: "🐟" },
    properties: {
      Nom: { title: [{ plain_text: "Saumon au four" }] },
      Categorie: { multi_select: [{ name: "PLAT" }] },
      Saison: { multi_select: [{ name: "Printemps" }, { name: "Été" }] },
      Ingredients: [
        { name: "Saumon" }, { name: "Citron" },
        { name: "Aneth" }, { name: "Pommes de terre" }
      ]
    }
  }
];

const MOCK_INGREDIENTS = [
  { name: "Pâtes", lieu: "1 - Épicerie", icon: { type: "emoji", emoji: "🍝" } },
  { name: "Lardons", lieu: "2 - Boucherie", icon: { type: "emoji", emoji: "🥓" } },
  { name: "Œufs", lieu: "2 - Boucherie", icon: { type: "emoji", emoji: "🥚" } },
  { name: "Parmesan", lieu: "3 - Fromagerie", icon: { type: "emoji", emoji: "🧀" } },
  { name: "Poivre", lieu: "1 - Épicerie", icon: { type: "emoji", emoji: "🧂" } },
  { name: "Salade romaine", lieu: "4 - Fruits & légumes", icon: { type: "emoji", emoji: "🥬" } },
  { name: "Poulet", lieu: "2 - Boucherie", icon: { type: "emoji", emoji: "🍗" } },
  { name: "Croûtons", lieu: "1 - Épicerie", icon: { type: "emoji", emoji: "🥖" } },
  { name: "Sauce césar", lieu: "1 - Épicerie", icon: { type: "emoji", emoji: "🥣" } },
  { name: "Carottes", lieu: "4 - Fruits & légumes", icon: { type: "emoji", emoji: "🥕" } },
  { name: "Poireaux", lieu: "4 - Fruits & légumes", icon: { type: "emoji", emoji: "🥬" } },
  { name: "Pommes de terre", lieu: "4 - Fruits & légumes", icon: { type: "emoji", emoji: "🥔" } },
  { name: "Oignon", lieu: "4 - Fruits & légumes", icon: { type: "emoji", emoji: "🧅" } },
  { name: "Pois chiches", lieu: "1 - Épicerie", icon: { type: "emoji", emoji: "🫘" } },
  { name: "Lait de coco", lieu: "1 - Épicerie", icon: { type: "emoji", emoji: "🥥" } },
  { name: "Curry", lieu: "1 - Épicerie", icon: { type: "emoji", emoji: "🍛" } },
  { name: "Riz", lieu: "1 - Épicerie", icon: { type: "emoji", emoji: "🍚" } },
  { name: "Saumon", lieu: "5 - Poissonnerie", icon: { type: "emoji", emoji: "🐟" } },
  { name: "Citron", lieu: "4 - Fruits & légumes", icon: { type: "emoji", emoji: "🍋" } },
  { name: "Aneth", lieu: "4 - Fruits & légumes", icon: { type: "emoji", emoji: "🌿" } }
];

const MIC_BLACK_SRC = "mic-noir.png";
const MIC_GREEN_SRC = "mic-vert.png";



// ---------- SAISON ---------- //
function getCurrentSeason() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  if ((month === 3 && day >= 20) || (month > 3 && month < 6) || (month === 6 && day <= 20)) return "Printemps";
  if ((month === 6 && day >= 21) || (month > 6 && month < 9) || (month === 9 && day <= 22)) return "Été";
  if ((month === 9 && day >= 23) || (month > 9 && month < 12) || (month === 12 && day <= 20)) return "Automne";
  return "Hiver";
}

// ---------- FETCH RECIPES ---------- //
async function fetchRecipes() {
  if (USE_MOCK_DATA) return MOCK_RECIPES;
  try {
    const res = await fetch("/api/recipes");
    const data = await res.json();
    if (!data || !Array.isArray(data.results)) {
      console.error("Réponse invalide de l'API Notion :", data);
      return [];
    }
    return data.results;
  } catch (err) {
    console.error("Erreur fetch /api/recipes :", err);
    return [];
  }
}

// ---------- FETCH INGREDIENT MAP ---------- //
async function fetchIngredientMap() {
  if (USE_MOCK_DATA) {
    ingredientMap = {};
    MOCK_INGREDIENTS.forEach(i => {
      ingredientMap[i.name] = i.icon?.emoji || null;
    });
    return;
  }
  try {
    const res = await fetch("/api/ingredients");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.results)) return;

    ingredientMap = {};
    data.results.forEach(ing => {
      if (!ing.name) return;
      if (ing.icon?.type === "emoji") ingredientMap[ing.name] = ing.icon.emoji;
      else if (ing.icon?.type === "custom_emoji") ingredientMap[ing.name] = ing.icon.custom_emoji.url;
      else if (ing.icon?.type === "external") ingredientMap[ing.name] = ing.icon.external.url;
      else if (ing.icon?.type === "file") ingredientMap[ing.name] = ing.icon.file.url;
      else ingredientMap[ing.name] = null;
    });
  } catch (err) {
    console.error("Erreur fetch /ingredients :", err);
    ingredientMap = {};
  }
}

// ---------- UPDATE RECIPE BLOCK ---------- //
function updateRecipeBlock(block, recipe) {
  const name = recipe?.properties?.Nom?.title?.[0]?.plain_text || "Sans nom";

  let iconHTML = "";
  if (recipe.icon) {
    if (recipe.icon.type === "emoji") iconHTML = recipe.icon.emoji;
    else if (recipe.icon.type === "external")
      iconHTML = `<img src="${recipe.icon.external.url}" style="width:22px;margin-right:6px;vertical-align:middle;">`;
    else if (recipe.icon.type === "custom_emoji")
      iconHTML = `<img src="${recipe.icon.custom_emoji.url}" style="width:22px;margin-right:6px;vertical-align:middle;">`;
    else if (recipe.icon.type === "file")
      iconHTML = `<img src="${recipe.icon.file.url}" style="width:22px;margin-right:6px;vertical-align:middle;">`;
  }

  block.querySelector(".icon-recette").innerHTML = iconHTML;
  block.querySelector(".name").textContent = name;
}

// ---------- POP-IN INGREDIENTS ---------- //
function showIngredients(recipe) {
  const title = recipe?.properties?.Nom?.title?.[0]?.plain_text || "Sans nom";
  const ingredients = recipe?.properties?.Ingredients || [];

  document.getElementById("popup-title").textContent = title;
  const list = document.getElementById("popup-ingredients");
  list.innerHTML = "";

  ingredients.forEach(ing => {
    const li = document.createElement("li");
    const icon = ingredientMap?.[ing.name];
    let iconHtml = "";

    if (icon) {
      if (icon.startsWith("http")) {
        iconHtml = `<img src="${icon}" alt="" style="width:20px;margin-right:6px;vertical-align:middle;">`;
      } else {
        iconHtml = `${icon} `;
      }
    }

    li.innerHTML = `${iconHtml}${ing.name}`;
    list.appendChild(li);
  });

  document.getElementById("recipe-popup").classList.remove("hidden");
}

popup.onclick = () => popup.classList.add("hidden");


// ---------- UTILITAIRES ---------- //

// Retourne tous les repas sélectionnés, pour toutes les semaines
function getAllSelectedRecipesForMail() {
  const all = [];

  for (let w = 0; w < NUM_WEEKS; w++) {
    if (!selectedRecipes[w]) continue;

    const weekLabel = getWeekLabel(w);

    DAYS_MEALS.forEach((dm, dayIndex) => {
      const recipes = (selectedRecipes[w][dayIndex] || []).filter(Boolean);
      if (!recipes.length) return;

      all.push({
        week: w,
        weekLabel,
        day: `${dm.day} ${dm.meal}`,
        recipes: recipes.map(extractRecipeForEmail)
      });
    });
  }

  return all;
}

function buildClipboardHTML(locationsMap, recipesForMail) {
  // Grouper par semaine
  const byWeek = {};
  recipesForMail.forEach(entry => {
    if (!byWeek[entry.week]) byWeek[entry.week] = { label: entry.weekLabel, entries: [] };
    byWeek[entry.week].entries.push(entry);
  });

  let recipesHTML = "";

Object.keys(byWeek).sort((a, b) => a - b).forEach(w => {
  const { label, entries } = byWeek[w];

  recipesHTML += `<h3>${label}</h3>`;

  entries.forEach(entry => {
    entry.recipes.forEach(r => {
      recipesHTML += `
        <p>
          <strong>${entry.day} : ${r.nom}</strong><br>
          <span style="font-weight:normal;">${r.ingredients.join(", ")}</span>
        </p>`;
    });
  });
});
  // ✅ Liste de courses globale (toutes semaines confondues)
const shopping = {};

recipesForMail.forEach(entry => {
  entry.recipes.forEach(r => {
    r.ingredients.forEach(ing => {
      const lieu = locationsMap[ing] || "Lieu inconnu";
      if (!shopping[lieu]) shopping[lieu] = {};
      shopping[lieu][ing] = (shopping[lieu][ing] || 0) + 1;
    });
  });
});
let shoppingHTML = "";

const sortedLieux = Object.keys(shopping).sort((a, b) =>
  a.localeCompare(b, "fr", { sensitivity: "base" })
);

sortedLieux.forEach(lieu => {
  const displayLieu = lieu.slice(3);
  const items = Object.entries(shopping[lieu])
    .sort(([a], [b]) => a.localeCompare(b, "fr", { sensitivity: "base" }))
    .map(([ing, count]) => `- ${ing}${count > 1 ? ` (x${count})` : ""}`)
    .join("<br>");

  shoppingHTML += `
    <p>
      <strong>${displayLieu}</strong><br>
      <span style="font-weight:normal;">${items}</span>
    </p>`;
});

  return `
    <h2>Menus sur 4 semaines</h2>
    <br>
    <h4>RECETTES</h4><br>
    ${recipesHTML}
    <br>
    <h4>LISTES DE COURSES</h4><br>
    ${shoppingHTML}
  `;
}

async function copyToClipboardHTML(html, fallbackText) {
  const item = new ClipboardItem({
    "text/html": new Blob([html], { type: "text/html" }),
    "text/plain": new Blob([fallbackText], { type: "text/plain" })
  });
  await navigator.clipboard.write([item]);
}

function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, "")
    .trim();
}

// excludedRecipeIds est partagé entre toutes les semaines pour éviter les doublons globaux
function getRandomRecipe(recipes) {
  const available = recipes.filter(r => !excludedRecipeIds.has(r.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function filterRecipesBySeason(recipes, season) {
  return recipes.filter(recipe => {
    const seasons = recipe?.properties?.Saison?.multi_select || [];
    const categories = recipe?.properties?.Categorie?.multi_select || [];
    return seasons.some(s => s.name === season) &&
           !categories.some(c => EXCLUDED_CATEGORIES.includes(c.name));
  });
}

function isSoup(recipe) {
  const categories = recipe?.properties?.Categorie?.multi_select || [];
  return categories.some(c => c.name === "SOUPE");
}

function extractRecipeForEmail(recipe) {
  return {
    nom: recipe?.properties?.Nom?.title?.[0]?.plain_text || "Sans nom",
    ingredients: (recipe?.properties?.Ingredients || []).map(i => i.name)
  };
}

// Retourne le label de la semaine N à partir d'aujourd'hui
function getWeekLabel(weekIndex) {
  const today = new Date();
  const day = today.getDay(); // 0 = dimanche
  const daysUntilNextMonday = (8 - day) % 7 || 7;

  const monday = new Date(today);
  monday.setDate(today.getDate() + daysUntilNextMonday + weekIndex * 7);

  const options = { day: "numeric", month: "long" };
  return `Semaine ${weekIndex + 1} — du ${monday.toLocaleDateString("fr-FR", options)}`;
}

function scoreRecipe(spoken, recipeName) {
  const spokenWords = normalize(spoken).split(" ");
  const recipeWords = normalize(recipeName).split(" ");
  let score = 0;
  spokenWords.forEach(word => {
    if (recipeWords.includes(word)) score += word.length >= 6 ? 5 : 2;
  });
  if (normalize(recipeName).includes(normalize(spoken))) score += 10;
  score -= Math.max(0, recipeWords.length - spokenWords.length);
  return score;
}

function findClosestRecipe(spokenText, recipes) {
  let best = null;
  let bestScore = -Infinity;
  recipes.forEach(r => {
    const name = r.properties?.Nom?.title?.[0]?.plain_text;
    if (!name) return;
    const score = scoreRecipe(spokenText, name);
    if (score > bestScore) { bestScore = score; best = r; }
  });
  return bestScore > 0 ? best : null;
}

function stopMic(micBtn, micTimeout) {
  if (micTimeout) clearTimeout(micTimeout);
  micBtn.src = MIC_BLACK_SRC;
  micBtn.classList.remove("listening");
}

function listenOnce(onResult, onError) {
  if (!speechSupported) {
    onError && onError(new Error("Speech recognition not supported"));
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "fr-FR";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = e => onResult(e.results[0][0].transcript);
  recognition.onerror = e => onError && onError(e.error);
  recognition.start();
}


// ---------- AJOUTER UNE LIGNE DE RECETTE ---------- //

function addRecipeLine(container, recipe, weekIndex, dayIndex) {
  const line = document.createElement("div");
  line.classList.add("recipe-line");

  line.innerHTML = `
    <span class="icon-recette"></span>
    <span class="name"></span>
    <div class="recipe-actions">
      <img src="mic-noir.png" class="icon icon-mic" title="Dicter une recette" />
      <img src="change.png" class="icon icon-change" title="Modifier la recette" />
      <img src="trash.PNG" class="icon icon-trash" title="Supprimer la recette" />
    </div>
  `;

  const micBtn = line.querySelector(".icon-mic");
  let micTimeout;

  micBtn.onclick = (e) => {
    e.stopPropagation();
    micBtn.src = MIC_GREEN_SRC;
    micBtn.classList.add("listening");

    micTimeout = setTimeout(() => stopMic(micBtn, micTimeout), 8000);

    listenOnce(
      spokenText => {
        stopMic(micBtn, micTimeout);
        const newRecipe = findClosestRecipe(spokenText, allRecipesCache);
        if (!newRecipe) { alert(`Aucune recette trouvée pour "${spokenText}"`); return; }

        const idx = selectedRecipes[weekIndex][dayIndex].indexOf(recipe);
        selectedRecipes[weekIndex][dayIndex][idx] = newRecipe;
        updateRecipeBlock(line, newRecipe);

        line.querySelector(".name").onclick = () => showIngredients(newRecipe);
        line.querySelector(".icon-recette").onclick = () => showIngredients(newRecipe);
        recipe = newRecipe;
      },
      error => {
        stopMic(micBtn, micTimeout);
        console.error("Erreur reconnaissance vocale", error);
      }
    );
  };

  container.appendChild(line);
  updateRecipeBlock(line, recipe);

  line.querySelector(".name").onclick = () => showIngredients(recipe);
  line.querySelector(".icon-recette").onclick = () => showIngredients(recipe);

  // Bouton modifier
  line.querySelector(".icon-change").onclick = (e) => {
    e.stopPropagation();
    excludedRecipeIds.add(recipe.id);

    const isSundayEvening =
      DAYS_MEALS[dayIndex].day === "Dimanche" &&
      DAYS_MEALS[dayIndex].meal === "soir" &&
      getCurrentSeason() === "Hiver";

    const source = isSundayEvening
      ? allRecipesCache.filter(isSoup)
      : allRecipesCache;

    const newRecipe = getRandomRecipe(source);
    if (!newRecipe) { alert("Plus de recettes disponibles"); return; }

    const idx = selectedRecipes[weekIndex][dayIndex].indexOf(recipe);
    selectedRecipes[weekIndex][dayIndex][idx] = newRecipe;
    updateRecipeBlock(line, newRecipe);

    line.querySelector(".name").onclick = () => showIngredients(newRecipe);
    line.querySelector(".icon-recette").onclick = () => showIngredients(newRecipe);
    recipe = newRecipe;
  };

  // Bouton supprimer
  line.querySelector(".icon-trash").onclick = (e) => {
    e.stopPropagation();
    selectedRecipes[weekIndex][dayIndex] =
      selectedRecipes[weekIndex][dayIndex].filter(r => r.id !== recipe.id);
    excludedRecipeIds.delete(recipe.id);
    line.remove();
  };
}


// ---------- INIT MENU ---------- //
async function initMenu() {
  const weeksContainer = document.getElementById("weeks-container");
  if (!weeksContainer) {
    console.error("weeks-container introuvable !");
    return;
  }

  const allRecipes = await fetchRecipes();
  const CURRENT_SEASON = getCurrentSeason();
  const recipes = filterRecipesBySeason(allRecipes, CURRENT_SEASON);
  allRecipesCache = recipes;
  const soups = recipes.filter(isSoup);

  if (!recipes.length) {
    weeksContainer.textContent = `Aucune recette pour la saison : ${CURRENT_SEASON}`;
    return;
  }

  weeksContainer.innerHTML = "";
  selectedRecipes = {};

  for (let w = 0; w < NUM_WEEKS; w++) {
    selectedRecipes[w] = {};

    // --- Colonne semaine ---
    const weekCol = document.createElement("div");
    weekCol.classList.add("week-column");
    weekCol.dataset.week = w;

    const weekHeader = document.createElement("div");
    weekHeader.classList.add("week-header");
    weekHeader.textContent = getWeekLabel(w);
    weekCol.appendChild(weekHeader);

    const menuList = document.createElement("div");
    menuList.classList.add("menu-list");
    weekCol.appendChild(menuList);

    weeksContainer.appendChild(weekCol);

    // --- Créneaux du jour ---
    DAYS_MEALS.forEach((dm, dayIndex) => {
      // Choisir la recette initiale
      let recipe;
      const isSundayEvening =
        dm.day === "Dimanche" && dm.meal === "soir" && CURRENT_SEASON === "Hiver";

      if (isSundayEvening && soups.length > 0) {
        recipe = getRandomRecipe(soups);
      } else {
        recipe = getRandomRecipe(recipes);
      }

      selectedRecipes[w][dayIndex] = recipe ? [recipe] : [];
      if (recipe) excludedRecipeIds.add(recipe.id);

      // Bloc du jour
      const div = document.createElement("div");
      div.classList.add("menu-item");
      div.dataset.week = w;
      div.dataset.index = dayIndex;

      div.innerHTML = `
        <div class="day-label">${dm.day} <span class="meal-badge meal-${dm.meal}">${dm.meal}</span></div>
        <div class="recipes-container"></div>
        <button class="add-recipe-btn">+ Ajouter</button>
        <div class="search-recipe-wrapper">
          <input type="text" class="search-recipe-input" placeholder="Chercher une recette..." />
          <ul class="search-recipe-dropdown hidden"></ul>
        </div>
      `;

      menuList.appendChild(div);

      const recipesContainer = div.querySelector(".recipes-container");
      const addBtn = div.querySelector(".add-recipe-btn");

      // Bouton ajouter
      addBtn.onclick = () => {
        const isSE =
          DAYS_MEALS[dayIndex].day === "Dimanche" &&
          DAYS_MEALS[dayIndex].meal === "soir" &&
          getCurrentSeason() === "Hiver";

        const source = isSE ? allRecipesCache.filter(isSoup) : allRecipesCache;
        const newRecipe = getRandomRecipe(source);
        if (!newRecipe) { alert("Plus de recettes disponibles"); return; }

        excludedRecipeIds.add(newRecipe.id);
        selectedRecipes[w][dayIndex].push(newRecipe);
        addRecipeLine(recipesContainer, newRecipe, w, dayIndex);
      };

      // Recherche clavier
      const searchInput = div.querySelector(".search-recipe-input");
      const dropdown = div.querySelector(".search-recipe-dropdown");

      searchInput.addEventListener("input", () => {
        const query = normalize(searchInput.value);
        dropdown.innerHTML = "";
        if (!query) { dropdown.classList.add("hidden"); return; }

        const matches = allRecipesCache.filter(r => {
          const name = r.properties?.Nom?.title?.[0]?.plain_text || "";
          return normalize(name).includes(query);
        });

        if (!matches.length) { dropdown.classList.add("hidden"); return; }

        matches.forEach(r => {
          const li = document.createElement("li");
          const name = r.properties?.Nom?.title?.[0]?.plain_text || "Sans nom";
          const emoji = r.icon?.type === "emoji" ? r.icon.emoji + " " : "";
          li.textContent = emoji + name;

          li.addEventListener("mousedown", () => {
            selectedRecipes[w][dayIndex].push(r);
            excludedRecipeIds.add(r.id);
            addRecipeLine(recipesContainer, r, w, dayIndex);
            searchInput.value = "";
            dropdown.classList.add("hidden");
          });

          dropdown.appendChild(li);
        });

        dropdown.classList.remove("hidden");
      });

      searchInput.addEventListener("blur", () => {
        setTimeout(() => dropdown.classList.add("hidden"), 150);
      });

      // Afficher les recettes initiales
      selectedRecipes[w][dayIndex].forEach(r => {
        addRecipeLine(recipesContainer, r, w, dayIndex);
      });
    });
  }
}


// ---------- CHARGEMENT DES LIEUX ---------- //
async function loadIngredientLocations() {
  if (USE_MOCK_DATA) {
    const map = {};
    MOCK_INGREDIENTS.forEach(i => { map[i.name] = i.lieu || "Lieu inconnu"; });
    return { locations: map, icons: {} };
  }
  try {
    const res = await fetch("/api/ingredients");
    if (!res.ok) throw new Error("Impossible de charger les ingrédients depuis Notion");

    const data = await res.json();
    const map = {};
    const icons = {};

    data.results.forEach(ing => {
      if (!ing.name) return;
      map[ing.name] = ing.lieu || "Lieu inconnu";
      if (ing.icon?.type === "emoji") icons[ing.name] = ing.icon.emoji;
      else if (ing.icon?.type === "custom_emoji") icons[ing.name] = ing.icon.custom_emoji.url;
      else if (ing.icon?.type === "external") icons[ing.name] = ing.icon.external.url;
      else if (ing.icon?.type === "file") icons[ing.name] = ing.icon.file.url;
      else icons[ing.name] = null;
    });

    return { locations: map, icons };
  } catch (err) {
    console.error("Erreur loadIngredientLocations :", err);
    return { locations: {}, icons: {} };
  }
}

function buildShoppingData(recipesForMail, locationsMap) {
  const shopping = {};

  recipesForMail.forEach(entry => {
    entry.recipes.forEach(r => {
      r.ingredients.forEach(ing => {
        const lieu = locationsMap[ing] || "Lieu inconnu";

        if (!shopping[lieu]) shopping[lieu] = {};
        if (!shopping[lieu][ing]) {
          shopping[lieu][ing] = {
            count: 0,
            recipes: []
          };
        }

        shopping[lieu][ing].count += 1;
        shopping[lieu][ing].recipes.push({
          name: r.nom,
          day: entry.day,
          week: entry.weekLabel
        });
      });
    });
  });

  return shopping;
}
function renderShoppingList(shopping, icons) {
  const container = document.getElementById("shopping-list-container");
  container.innerHTML = "";

  const sortedLieux = Object.keys(shopping).sort((a, b) =>
    a.localeCompare(b, "fr", { sensitivity: "base" })
  );

  sortedLieux.forEach(lieu => {
    const section = document.createElement("div");

    const title = document.createElement("h4");
    title.textContent = lieu.slice(3);
    section.appendChild(title);

    Object.entries(shopping[lieu]).forEach(([ing, data]) => {
      const row = document.createElement("div");
      row.classList.add("shopping-item");
      const icon = icons?.[ing];
      // Nom + quantité

 const label = document.createElement("span");
label.style.cursor = "pointer";

// Icône
if (icon) {
  if (icon.startsWith("http")) {
    const img = document.createElement("img");
    img.src = icon;
    img.style.width = "18px";
    img.style.height = "18px";
    img.style.marginRight = "6px";
    img.style.verticalAlign = "middle";
    label.appendChild(img);
  } else {
    const iconSpan = document.createElement("span");
    iconSpan.textContent = icon + " ";
    label.appendChild(iconSpan);
  }
}

// Texte (UNE seule fois)
label.appendChild(
  document.createTextNode(
    `${ing}${data.count > 1 ? ` (x${data.count})` : ""}`
  )
);

      // CLICK → afficher recettes
      label.onclick = () => showRecipesUsingIngredient(ing, data.recipes);

      // Bouton supprimer
      const trash = document.createElement("img");
      trash.src = "trash.PNG";
      trash.classList.add("icon");
      trash.style.cursor = "pointer";

      trash.onclick = (e) => {
  e.stopPropagation();

  delete shopping[lieu][ing];

  if (Object.keys(shopping[lieu]).length === 0) {
    delete shopping[lieu];
  }

  // 🔥 MAJ état global
  currentShoppingState = shopping;

  renderShoppingList(shopping, icons);
};

      const left = document.createElement("div");
left.style.display = "flex";
left.style.alignItems = "center";
left.style.gap = "8px";

left.appendChild(label);
left.appendChild(trash);

row.appendChild(left);
      section.appendChild(row);
    });

    container.appendChild(section);
  });
}
function showRecipesUsingIngredient(ingredient, recipes) {
  document.getElementById("popup-title").textContent = ingredient;

  const list = document.getElementById("popup-ingredients");
  list.innerHTML = "";

  recipes.forEach(r => {
    const li = document.createElement("li");
    

// retrouver la recette complète pour l’icône
const fullRecipe = allRecipesCache.find(rec => 
  rec.properties?.Nom?.title?.[0]?.plain_text === r.name
);

let iconHtml = "";
if (fullRecipe?.icon?.type === "emoji") {
  iconHtml = fullRecipe.icon.emoji + " ";
}

li.innerHTML = `${iconHtml}${r.name}`;
    list.appendChild(li);
  });

  document.getElementById("recipe-popup").classList.remove("hidden");
}


// ---------- DÉMARRAGE ---------- //
async function startApp() {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "block";

  try {
    await Promise.all([fetchRecipes(), fetchIngredientMap()]);
    await initMenu();
  } catch (err) {
    console.error("Erreur au démarrage de l'app :", err);
  } finally {
    if (loader) loader.style.display = "none";
  }
}
function buildShoppingHTMLFromState(shopping, locationsMap) {
  let html = "";

  const sortedLieux = Object.keys(shopping || {}).sort((a, b) =>
    a.localeCompare(b, "fr", { sensitivity: "base" })
  );

  sortedLieux.forEach(lieu => {
    const displayLieu = lieu.slice(3);

    const items = Object.entries(shopping[lieu])
      .map(([ing, data]) => `- ${ing}${data.count > 1 ? ` (x${data.count})` : ""}`)
      .join("<br>");

    html += `
      <p>
        <strong>${displayLieu}</strong><br>
        ${items}
      </p>`;
  });

  return html;
}
function buildRecipesHTMLOnly(recipesForMail) {
  const byWeek = {};

  recipesForMail.forEach(entry => {
    if (!byWeek[entry.week]) {
      byWeek[entry.week] = { label: entry.weekLabel, entries: [] };
    }
    byWeek[entry.week].entries.push(entry);
  });

  let html = "";

  Object.keys(byWeek).sort((a, b) => a - b).forEach(w => {
    const { label, entries } = byWeek[w];

    html += `<h3>${label}</h3>`;

    entries.forEach(entry => {
      entry.recipes.forEach(r => {
        html += `
          <p>
            <strong>${entry.day} : ${r.nom}</strong><br>
            ${r.ingredients.join(", ")}
          </p>`;
      });
    });
  });

  return html;
}


// ---------- BOUTON COPIER ---------- //
document.getElementById("send-mail-btn").addEventListener("click", async () => {
  const btn = document.getElementById("send-mail-btn");

  try {
    btn.disabled = true;
    btn.textContent = "Copie en cours...";

    const recipesForMail = getAllSelectedRecipesForMail();
    const { locations } = await loadIngredientLocations();

    // 🔥 IMPORTANT : on reconstruit la liste à partir de l’état modifié
    const shoppingHTML = buildShoppingHTMLFromState(currentShoppingState, locations);

    const clipboardHTML = `
      <h2>Menus sur 4 semaines</h2>
      <h4>RECETTES</h4>
      ${buildRecipesHTMLOnly(recipesForMail)}
      <h4>LISTE DE COURSES</h4>
      ${shoppingHTML}
    `;

    await copyToClipboardHTML(
      clipboardHTML,
      clipboardHTML.replace(/<[^>]+>/g, "")
    );

    btn.textContent = "Copié ✅";
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = "Copier les menus et la liste";
  }
});

startApp();
document.getElementById("sort-shopping-btn").addEventListener("click", async () => {
  const container = document.getElementById("shopping-list-container");

  container.classList.remove("hidden");

  const recipesForMail = getAllSelectedRecipesForMail();
  const { locations, icons } = await loadIngredientLocations();

  const shoppingData = buildShoppingData(recipesForMail, locations);

  currentShoppingState = shoppingData;
  shoppingIsSorted = true;

  renderShoppingList(shoppingData, icons);

  // 👉 afficher bouton copier après tri
  const copyBtn = document.getElementById("send-mail-btn");
  copyBtn.style.display = "inline-block";
});
});
