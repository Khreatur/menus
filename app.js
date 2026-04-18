document.addEventListener("DOMContentLoaded", () => {

// ============================================================
// CONFIGURATION
// ============================================================

const USE_MOCK_DATA = false;

const EXCLUDED_CATEGORIES = ["APERO", "BRUNCH"];

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

let numWeeks = 2;


// ============================================================
// ÉTAT GLOBAL
// ============================================================

// selectedRecipes[weekIndex][dayIndex] = [recipe, ...]
let selectedRecipes   = {};
let excludedRecipeIds = new Set();
let ingredientMap     = {};    // ing.name → icône (emoji ou URL)
let allRecipesCache   = [];

let currentShoppingState = null;
let shoppingIsSorted     = false;


// ============================================================
// DONNÉES DE TEST (USE_MOCK_DATA = true)
// ============================================================

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
  { name: "Pâtes",          lieu: "1 - Épicerie",         icon: { type: "emoji", emoji: "🍝" } },
  { name: "Lardons",        lieu: "2 - Boucherie",         icon: { type: "emoji", emoji: "🥓" } },
  { name: "Œufs",           lieu: "2 - Boucherie",         icon: { type: "emoji", emoji: "🥚" } },
  { name: "Parmesan",       lieu: "3 - Fromagerie",        icon: { type: "emoji", emoji: "🧀" } },
  { name: "Poivre",         lieu: "1 - Épicerie",          icon: { type: "emoji", emoji: "🧂" } },
  { name: "Salade romaine", lieu: "4 - Marché",            icon: { type: "emoji", emoji: "🥬" } },
  { name: "Poulet",         lieu: "2 - Boucherie",         icon: { type: "emoji", emoji: "🍗" } },
  { name: "Croûtons",       lieu: "1 - Épicerie",          icon: { type: "emoji", emoji: "🥖" } },
  { name: "Sauce césar",    lieu: "1 - Épicerie",          icon: { type: "emoji", emoji: "🥣" } },
  { name: "Carottes",       lieu: "4 - Marché",            icon: { type: "emoji", emoji: "🥕" } },
  { name: "Poireaux",       lieu: "4 - Marché",            icon: { type: "emoji", emoji: "🥬" } },
  { name: "Pommes de terre",lieu: "4 - Marché",            icon: { type: "emoji", emoji: "🥔" } },
  { name: "Oignon",         lieu: "4 - Marché",            icon: { type: "emoji", emoji: "🧅" } },
  { name: "Pois chiches",   lieu: "1 - Épicerie",          icon: { type: "emoji", emoji: "🫘" } },
  { name: "Lait de coco",   lieu: "1 - Épicerie",          icon: { type: "emoji", emoji: "🥥" } },
  { name: "Curry",          lieu: "1 - Épicerie",          icon: { type: "emoji", emoji: "🍛" } },
  { name: "Riz",            lieu: "1 - Épicerie",          icon: { type: "emoji", emoji: "🍚" } },
  { name: "Saumon",         lieu: "5 - Poissonnerie",      icon: { type: "emoji", emoji: "🐟" } },
  { name: "Citron",         lieu: "4 - Marché",            icon: { type: "emoji", emoji: "🍋" } },
  { name: "Aneth",          lieu: "4 - Marché",            icon: { type: "emoji", emoji: "🌿" } }
];


// ============================================================
// UTILITAIRES GÉNÉRAUX
// ============================================================

// Retourne la saison courante
function getCurrentSeason() {
  const now   = new Date();
  const month = now.getMonth() + 1;
  const day   = now.getDate();
  if ((month === 3 && day >= 20) || (month > 3 && month < 6) || (month === 6 && day <= 20)) return "Printemps";
  if ((month === 6 && day >= 21) || (month > 6 && month < 9) || (month === 9 && day <= 22)) return "Été";
  if ((month === 9 && day >= 23) || (month > 9 && month < 12) || (month === 12 && day <= 20)) return "Automne";
  return "Hiver";
}

// Retourne le label lisible de la semaine N (ex: "Semaine 1 — du 21 avril")
function getWeekLabel(weekIndex) {
  const today = new Date();
  const daysUntilNextMonday = (8 - today.getDay()) % 7 || 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysUntilNextMonday + weekIndex * 7);
  return `Semaine ${weekIndex + 1} — du ${monday.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`;
}

// Normalise une chaîne pour la recherche (minuscules, sans accents ni ponctuation)
function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, "")
    .trim();
}

// Retourne true si le lieu correspond au Marché (sensible à la casse, exclut "Supermarché")
function isMarche(lieu) {
  return lieu.includes("Marché");
}

// Encode un objet JS en hash URL compressé via LZString
function encodeToHash(obj) {
  return LZString.compressToEncodedURIComponent(JSON.stringify(obj));
}

// Copie du HTML+texte dans le presse-papier
async function copyToClipboardHTML(html, fallbackText) {
  const item = new ClipboardItem({
    "text/html": new Blob([html], { type: "text/html" }),
    "text/plain": new Blob([fallbackText], { type: "text/plain" })
  });
  await navigator.clipboard.write([item]);
}


// ============================================================
// UTILITAIRES RECETTES
// ============================================================

// Filtre les recettes par saison courante et exclut certaines catégories
function filterRecipesBySeason(recipes, season) {
  return recipes.filter(recipe => {
    const seasons    = recipe?.properties?.Saison?.multi_select || [];
    const categories = recipe?.properties?.Categorie?.multi_select || [];
    return seasons.some(s => s.name === season) &&
           !categories.some(c => EXCLUDED_CATEGORIES.includes(c.name));
  });
}

// Retourne true si la recette est une soupe
function isSoup(recipe) {
  return (recipe?.properties?.Categorie?.multi_select || [])
    .some(c => c.name === "SOUPE");
}

// Pioche une recette aléatoire parmi celles non encore utilisées
function getRandomRecipe(recipes) {
  const available = recipes.filter(r => !excludedRecipeIds.has(r.id));
  if (!available.length) return null;
  return available[Math.floor(Math.random() * available.length)];
}

// Extrait les données minimales d'une recette pour l'e-mail / le payload
function extractRecipeForEmail(recipe) {
  return {
    nom: recipe?.properties?.Nom?.title?.[0]?.plain_text || "Sans nom",
    ingredients: (recipe?.properties?.Ingredients || []).map(i => i.name)
  };
}

// Retourne le HTML d'une icône de recette (emoji ou img)
function getRecipeIconHTML(icon) {
  if (!icon) return "";
  if (icon.type === "emoji")        return icon.emoji;
  if (icon.type === "external")     return `<img src="${icon.external.url}" style="width:22px;margin-right:6px;vertical-align:middle;">`;
  if (icon.type === "custom_emoji") return `<img src="${icon.custom_emoji.url}" style="width:22px;margin-right:6px;vertical-align:middle;">`;
  if (icon.type === "file")         return `<img src="${icon.file.url}" style="width:22px;margin-right:6px;vertical-align:middle;">`;
  return "";
}

// Retourne la valeur scalaire de l'icône d'une recette (emoji string ou URL) pour la sérialisation
function extractRecipeIconValue(icon) {
  if (!icon) return null;
  if (icon.type === "emoji")        return icon.emoji;
  if (icon.type === "external")     return icon.external?.url || null;
  if (icon.type === "custom_emoji") return icon.custom_emoji?.url || null;
  if (icon.type === "file")         return icon.file?.url || null;
  return null;
}

// Score de correspondance entre un texte dicté et un nom de recette
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

// Trouve la recette la plus proche d'un texte dicté
function findClosestRecipe(spokenText, recipes) {
  let best = null, bestScore = -Infinity;
  recipes.forEach(r => {
    const name = r.properties?.Nom?.title?.[0]?.plain_text;
    if (!name) return;
    const score = scoreRecipe(spokenText, name);
    if (score > bestScore) { bestScore = score; best = r; }
  });
  return bestScore > 0 ? best : null;
}

// Retourne l'ensemble des repas sélectionnés pour toutes les semaines
function getAllSelectedRecipesForMail() {
  const all = [];
  for (let w = 0; w < numWeeks; w++){
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


// ============================================================
// FETCH API / NOTION
// ============================================================

async function fetchRecipes() {
  if (USE_MOCK_DATA) return MOCK_RECIPES;
  try {
    const res  = await fetch("/api/recipes");
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

// Charge la map ingrédientsName → icône (emoji ou URL) dans la variable globale ingredientMap
async function fetchIngredientMap() {
  if (USE_MOCK_DATA) {
    ingredientMap = {};
    MOCK_INGREDIENTS.forEach(i => { ingredientMap[i.name] = i.icon?.emoji || null; });
    return;
  }
  try {
    const res  = await fetch("/api/ingredients");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.results)) return;
    ingredientMap = {};
    data.results.forEach(ing => {
      if (!ing.name) return;
      if (ing.icon?.type === "emoji")        ingredientMap[ing.name] = ing.icon.emoji;
      else if (ing.icon?.type === "custom_emoji") ingredientMap[ing.name] = ing.icon.custom_emoji.url;
      else if (ing.icon?.type === "external")     ingredientMap[ing.name] = ing.icon.external.url;
      else if (ing.icon?.type === "file")         ingredientMap[ing.name] = ing.icon.file.url;
      else ingredientMap[ing.name] = null;
    });
  } catch (err) {
    console.error("Erreur fetch /api/ingredients :", err);
    ingredientMap = {};
  }
}

// Charge lieux et icônes des ingrédients depuis Notion (ou mock)
async function loadIngredientLocations() {
  if (USE_MOCK_DATA) {
    const locations = {}, icons = {};
    MOCK_INGREDIENTS.forEach(i => {
      locations[i.name] = i.lieu || "Lieu inconnu";
      icons[i.name]     = i.icon?.emoji || null;
    });
    return { locations, icons };
  }
  try {
    const res  = await fetch("/api/ingredients");
    if (!res.ok) throw new Error("Impossible de charger les ingrédients depuis Notion");
    const data = await res.json();
    const locations = {}, icons = {};
    data.results.forEach(ing => {
      if (!ing.name) return;
      locations[ing.name] = ing.lieu || "Lieu inconnu";
      if (ing.icon?.type === "emoji")             icons[ing.name] = ing.icon.emoji;
      else if (ing.icon?.type === "custom_emoji") icons[ing.name] = ing.icon.custom_emoji.url;
      else if (ing.icon?.type === "external")     icons[ing.name] = ing.icon.external.url;
      else if (ing.icon?.type === "file")         icons[ing.name] = ing.icon.file.url;
      else icons[ing.name] = null;
    });
    return { locations, icons };
  } catch (err) {
    console.error("Erreur loadIngredientLocations :", err);
    return { locations: {}, icons: {} };
  }
}


// ============================================================
// POPUP INGRÉDIENTS / RECETTES
// ============================================================

const popup = document.getElementById("recipe-popup");
popup.onclick = () => popup.classList.add("hidden");

// Affiche la popup avec la liste des ingrédients d'une recette
function showIngredients(recipe) {
  document.getElementById("popup-title").textContent =
    recipe?.properties?.Nom?.title?.[0]?.plain_text || "Sans nom";

  const list = document.getElementById("popup-ingredients");
  list.innerHTML = "";

  (recipe?.properties?.Ingredients || []).forEach(ing => {
    const li   = document.createElement("li");
    const icon = ingredientMap?.[ing.name];
    let iconHtml = "";
    if (icon) {
      iconHtml = icon.startsWith("http")
        ? `<img src="${icon}" alt="" style="width:20px;margin-right:6px;vertical-align:middle;">`
        : `${icon} `;
    }
    li.innerHTML = `${iconHtml}${ing.name}`;
    list.appendChild(li);
  });

  popup.classList.remove("hidden");
}

// Affiche la popup avec les recettes qui utilisent un ingrédient donné
function showRecipesUsingIngredient(ingredient, recipes) {
  document.getElementById("popup-title").textContent = ingredient;

  const list = document.getElementById("popup-ingredients");
  list.innerHTML = "";

  recipes.forEach(r => {
    const li         = document.createElement("li");
    const fullRecipe = allRecipesCache.find(rec =>
      rec.properties?.Nom?.title?.[0]?.plain_text === r.name
    );
    const iconHtml = fullRecipe?.icon?.type === "emoji" ? fullRecipe.icon.emoji + " " : "";
    li.innerHTML = `${iconHtml}${r.name}`;
    list.appendChild(li);
  });

  popup.classList.remove("hidden");
}


// ============================================================
// MENU — AFFICHAGE ET INTERACTIONS
// ============================================================

// gestion de bloc de semaines
function createWeekColumn(w, recipes, soups, CURRENT_SEASON, weeksContainer) {
  selectedRecipes[w] = {};

  const weekCol = document.createElement("div");
  weekCol.classList.add("week-column");
  weekCol.dataset.week = w;

  const weekHeader = document.createElement("div");
  weekHeader.classList.add("week-header");
  weekHeader.textContent = getWeekLabel(w);

  // 👉 bouton "+"
  const addBtn = document.createElement("button");
  addBtn.textContent = "+";
  addBtn.classList.add("add-week-btn");
  addBtn.onclick = addWeek;

  weekHeader.appendChild(addBtn);
  weekCol.appendChild(weekHeader);

  const menuList = document.createElement("div");
  menuList.classList.add("menu-list");
  weekCol.appendChild(menuList);

  weeksContainer.appendChild(weekCol);

  DAYS_MEALS.forEach((dm, dayIndex) => {
    const isSundayEvening =
      dm.day === "Dimanche" &&
      dm.meal === "soir" &&
      CURRENT_SEASON === "Hiver";

    const recipe = (isSundayEvening && soups.length)
      ? getRandomRecipe(soups)
      : getRandomRecipe(recipes);

    selectedRecipes[w][dayIndex] = recipe ? [recipe] : [];
    if (recipe) excludedRecipeIds.add(recipe.id);

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

    // bouton ajouter recette
    div.querySelector(".add-recipe-btn").onclick = () => {
      const newRecipe = getRandomRecipe(recipes);
      if (!newRecipe) return;
      selectedRecipes[w][dayIndex].push(newRecipe);
      excludedRecipeIds.add(newRecipe.id);
      addRecipeLine(recipesContainer, newRecipe, w, dayIndex);
    };

    selectedRecipes[w][dayIndex].forEach(r =>
      addRecipeLine(recipesContainer, r, w, dayIndex)
    );
  });
}

// bouton d'ajout de semaines
function addWeek() {
  const weeksContainer = document.getElementById("weeks-container");

  const CURRENT_SEASON = getCurrentSeason();
  const recipes = allRecipesCache;
  const soups = recipes.filter(isSoup);

  const newIndex = numWeeks;

  createWeekColumn(newIndex, recipes, soups, CURRENT_SEASON, weeksContainer);

  numWeeks++;
}

// Met à jour le bloc visuel d'une recette (icône + nom)
function updateRecipeBlock(block, recipe) {
  block.querySelector(".icon-recette").innerHTML =
    getRecipeIconHTML(recipe.icon);
  block.querySelector(".name").textContent =
    recipe?.properties?.Nom?.title?.[0]?.plain_text || "Sans nom";
}

// Crée et insère une ligne de recette dans le conteneur donné
function addRecipeLine(container, recipe, weekIndex, dayIndex) {
  const line = document.createElement("div");
  line.classList.add("recipe-line");
  line.innerHTML = `
    <span class="icon-recette"></span>
    <span class="name"></span>
    <div class="recipe-actions">
      <img src="change.png"   class="icon icon-change" title="Modifier la recette" />
      <img src="trash.PNG"    class="icon icon-trash"  title="Supprimer la recette" />
    </div>
  `;


  // Modifier → pioche une nouvelle recette aléatoire
  line.querySelector(".icon-change").onclick = (e) => {
    e.stopPropagation();
    excludedRecipeIds.add(recipe.id);
    const isSundayEvening =
      DAYS_MEALS[dayIndex].day === "Dimanche" &&
      DAYS_MEALS[dayIndex].meal === "soir" &&
      getCurrentSeason() === "Hiver";
    const source    = isSundayEvening ? allRecipesCache.filter(isSoup) : allRecipesCache;
    const newRecipe = getRandomRecipe(source);
    if (!newRecipe) { alert("Plus de recettes disponibles"); return; }
    const idx = selectedRecipes[weekIndex][dayIndex].indexOf(recipe);
    selectedRecipes[weekIndex][dayIndex][idx] = newRecipe;
    recipe = newRecipe;
    updateRecipeBlock(line, recipe);
    line.querySelector(".name").onclick        = () => showIngredients(recipe);
    line.querySelector(".icon-recette").onclick = () => showIngredients(recipe);
  };

  // Supprimer → retire la recette de l'état et du DOM
  line.querySelector(".icon-trash").onclick = (e) => {
    e.stopPropagation();
    selectedRecipes[weekIndex][dayIndex] =
      selectedRecipes[weekIndex][dayIndex].filter(r => r.id !== recipe.id);
    excludedRecipeIds.delete(recipe.id);
    line.remove();
  };

  container.appendChild(line);
  updateRecipeBlock(line, recipe);
  line.querySelector(".name").onclick        = () => showIngredients(recipe);
  line.querySelector(".icon-recette").onclick = () => showIngredients(recipe);
}

// Initialise la grille de menus (4 semaines × 12 créneaux)
async function initMenu() {
  const weeksContainer = document.getElementById("weeks-container");
  if (!weeksContainer) { console.error("weeks-container introuvable !"); return; }

  const allRecipes     = await fetchRecipes();
  const CURRENT_SEASON = getCurrentSeason();
  const recipes        = filterRecipesBySeason(allRecipes, CURRENT_SEASON);
  allRecipesCache      = recipes;
  const soups          = recipes.filter(isSoup);

  if (!recipes.length) {
    weeksContainer.textContent = `Aucune recette pour la saison : ${CURRENT_SEASON}`;
    return;
  }

  weeksContainer.innerHTML = "";
  selectedRecipes = {};

  for (let w = 0; w < numWeeks; w++){
    selectedRecipes[w] = {};

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

    DAYS_MEALS.forEach((dm, dayIndex) => {
      const isSundayEvening = dm.day === "Dimanche" && dm.meal === "soir" && CURRENT_SEASON === "Hiver";
      const recipe = (isSundayEvening && soups.length) ? getRandomRecipe(soups) : getRandomRecipe(recipes);

      selectedRecipes[w][dayIndex] = recipe ? [recipe] : [];
      if (recipe) excludedRecipeIds.add(recipe.id);

      const div = document.createElement("div");
      div.classList.add("menu-item");
      div.dataset.week  = w;
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

      // Bouton "+ Ajouter" → pioche aléatoirement
      div.querySelector(".add-recipe-btn").onclick = () => {
        const isSE = DAYS_MEALS[dayIndex].day === "Dimanche" &&
                     DAYS_MEALS[dayIndex].meal === "soir" &&
                     getCurrentSeason() === "Hiver";
        const newRecipe = getRandomRecipe(isSE ? allRecipesCache.filter(isSoup) : allRecipesCache);
        if (!newRecipe) { alert("Plus de recettes disponibles"); return; }
        excludedRecipeIds.add(newRecipe.id);
        selectedRecipes[w][dayIndex].push(newRecipe);
        addRecipeLine(recipesContainer, newRecipe, w, dayIndex);
      };

      // Recherche textuelle avec dropdown
      const searchInput = div.querySelector(".search-recipe-input");
      const dropdown    = div.querySelector(".search-recipe-dropdown");

      searchInput.addEventListener("input", () => {
        const query = normalize(searchInput.value);
        dropdown.innerHTML = "";
        if (!query) { dropdown.classList.add("hidden"); return; }

        const matches = allRecipesCache.filter(r =>
          normalize(r.properties?.Nom?.title?.[0]?.plain_text || "").includes(query)
        );
        if (!matches.length) { dropdown.classList.add("hidden"); return; }

        matches.forEach(r => {
          const li    = document.createElement("li");
          const name  = r.properties?.Nom?.title?.[0]?.plain_text || "Sans nom";
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
      selectedRecipes[w][dayIndex].forEach(r => addRecipeLine(recipesContainer, r, w, dayIndex));
    });
  }
}


// ============================================================
// LISTE DE COURSES — CONSTRUCTION DES DONNÉES
// ============================================================

// Construit la structure shopping depuis les menus sélectionnés :
// - Marché : shopping[lieu][weekLabel][ing] = { count, recipes }
// - Autres  : shopping[lieu][ing]           = { count, recipes }
function buildShoppingData(recipesForMail, locationsMap) {
  const shopping = {};

  recipesForMail.forEach(entry => {
    const weekLabel = entry.weekLabel;
    entry.recipes.forEach(r => {
      r.ingredients.forEach(ing => {
        const lieu = locationsMap[ing] || "Lieu inconnu";
        if (!shopping[lieu]) shopping[lieu] = {};

        if (isMarche(lieu)) {
          if (!shopping[lieu][weekLabel])       shopping[lieu][weekLabel] = {};
          if (!shopping[lieu][weekLabel][ing])  shopping[lieu][weekLabel][ing] = { count: 0, recipes: [] };
          shopping[lieu][weekLabel][ing].count += 1;
          shopping[lieu][weekLabel][ing].recipes.push({ name: r.nom, day: entry.day, week: weekLabel });
        } else {
          if (!shopping[lieu][ing]) shopping[lieu][ing] = { count: 0, recipes: [] };
          shopping[lieu][ing].count += 1;
          shopping[lieu][ing].recipes.push({ name: r.nom, day: entry.day, week: weekLabel });
        }
      });
    });
  });

  return shopping;
}


// ============================================================
// LISTE DE COURSES — RENDU DOM
// ============================================================

// Construit une ligne d'ingrédient (avec suppression)
function buildShoppingRow(ing, data, icons, onDelete) {
  const row   = document.createElement("div");
  row.classList.add("shopping-item");

  const label = document.createElement("span");
  label.style.cursor = "pointer";

  const icon = icons?.[ing];
  if (icon) {
    if (icon.startsWith("http")) {
      const img = document.createElement("img");
      img.src        = icon;
      img.style.cssText = "width:18px;height:18px;margin-right:6px;vertical-align:middle;";
      label.appendChild(img);
    } else {
      label.appendChild(Object.assign(document.createElement("span"), { textContent: icon + " " }));
    }
  }
  label.appendChild(document.createTextNode(`${ing}${data.count > 1 ? ` (x${data.count})` : ""}`));
  label.onclick = () => showRecipesUsingIngredient(ing, data.recipes);

  const trash = document.createElement("img");
  trash.src             = "trash.PNG";
  trash.classList.add("icon");
  trash.style.cursor    = "pointer";
  trash.onclick         = (e) => { e.stopPropagation(); onDelete(); };

  const left = document.createElement("div");
  left.style.cssText = "display:flex;align-items:center;gap:8px;";
  left.appendChild(label);
  left.appendChild(trash);

  row.appendChild(left);
  return row;
}

// Construit le champ d'ajout libre en bas de chaque section
function buildAddRow(section, lieu, shopping, icons) {
  const addRow  = document.createElement("div");
  addRow.classList.add("shopping-add-row");

  const input = document.createElement("input");
  input.type        = "text";
  input.placeholder = "+ Ajouter un article…";
  input.classList.add("shopping-add-input");

  function addItem() {
    const val = input.value.trim();
    if (!val) return;

    const data = { count: 1, recipes: [] };

    if (isMarche(lieu)) {
      // Les ajouts manuels au Marché sont regroupés dans un bucket dédié
      const bucket = "Ajouts manuels";
      if (!shopping[lieu][bucket]) shopping[lieu][bucket] = {};
      shopping[lieu][bucket][val] = data;
    } else {
      shopping[lieu][val] = data;
    }
    currentShoppingState = shopping;

    const newRow = buildShoppingRow(val, data, icons, () => {
      if (isMarche(lieu)) {
        const bucket = "Ajouts manuels";
        delete shopping[lieu][bucket]?.[val];
        if (shopping[lieu][bucket] && !Object.keys(shopping[lieu][bucket]).length)
          delete shopping[lieu][bucket];
      } else {
        delete shopping[lieu][val];
      }
      if (!Object.keys(shopping[lieu]).length) delete shopping[lieu];
      currentShoppingState = shopping;
      newRow.remove();
    });

    section.insertBefore(newRow, addRow);
    input.value = "";
    input.focus();
  }

  input.addEventListener("keydown", e => { if (e.key === "Enter") addItem(); });
  input.addEventListener("blur",    () => { if (input.value.trim()) addItem(); });

  addRow.appendChild(input);
  return addRow;
}

// Affiche la liste de courses complète dans #shopping-list-container
function renderShoppingList(shopping, icons) {
  const container = document.getElementById("shopping-list-container");
  container.innerHTML = "";

  const sortedLieux = Object.keys(shopping).sort((a, b) =>
    a.localeCompare(b, "fr", { sensitivity: "base" })
  );

  sortedLieux.forEach(lieu => {
    const section = document.createElement("div");
    section.classList.add("shopping-section");

    const sectionTitle = document.createElement("h4");
    sectionTitle.textContent = lieu.slice(3);
    section.appendChild(sectionTitle);

    if (isMarche(lieu)) {
      // Marché : items groupés par semaine
      const weekLabels = Object.keys(shopping[lieu]).sort((a, b) => {
        const na = parseInt(a.match(/\d+/)?.[0] || 0);
        const nb = parseInt(b.match(/\d+/)?.[0] || 0);
        return na - nb;
      });

      weekLabels.forEach(weekLabel => {
        const weekItems = shopping[lieu][weekLabel];
        if (!weekItems || !Object.keys(weekItems).length) return;

        const weekSubtitle = document.createElement("div");
        weekSubtitle.classList.add("shopping-week-subtitle");
        weekSubtitle.textContent = weekLabel;
        section.appendChild(weekSubtitle);

        Object.entries(weekItems).forEach(([ing, data]) => {
          section.appendChild(buildShoppingRow(ing, data, icons, () => {
            delete shopping[lieu][weekLabel][ing];
            if (!Object.keys(shopping[lieu][weekLabel]).length) delete shopping[lieu][weekLabel];
            if (!Object.keys(shopping[lieu]).length) delete shopping[lieu];
            currentShoppingState = shopping;
            renderShoppingList(shopping, icons);
          }));
        });
      });

    } else {
      // Autres rayons : liste plate agrégée
      Object.entries(shopping[lieu]).forEach(([ing, data]) => {
        section.appendChild(buildShoppingRow(ing, data, icons, () => {
          delete shopping[lieu][ing];
          if (!Object.keys(shopping[lieu]).length) delete shopping[lieu];
          currentShoppingState = shopping;
          renderShoppingList(shopping, icons);
        }));
      });
    }

    section.appendChild(buildAddRow(section, lieu, shopping, icons));
    container.appendChild(section);
  });

  const genBtn = document.getElementById("generate-links-btn");
  if (genBtn) genBtn.style.display = "inline-block";
}


// ============================================================
// GÉNÉRATION DES LIENS PARTAGEABLES
// ============================================================

// Sérialise la liste de courses (avec icônes) pour l'encoder dans l'URL
function buildShoppingPayload(shopping, iconsMap) {
  const enriched = {};

  Object.entries(shopping).forEach(([lieu, value]) => {
    enriched[lieu] = {};
    if (isMarche(lieu)) {
      Object.entries(value).forEach(([weekLabel, items]) => {
        enriched[lieu][weekLabel] = {};
        Object.entries(items).forEach(([ing, data]) => {
          enriched[lieu][weekLabel][ing] = {
            count: data.count, recipes: data.recipes,
            icon: iconsMap?.[ing] || null, _byWeek: true
          };
        });
      });
    } else {
      Object.entries(value).forEach(([ing, data]) => {
        enriched[lieu][ing] = {
          count: data.count, recipes: data.recipes, icon: iconsMap?.[ing] || null
        };
      });
    }
  });

  return {
    shopping: enriched,
    generatedAt: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
  };
}

// Sérialise les menus sélectionnés pour l'encoder dans l'URL
function buildMenusPayload() {
  const weeks = [];

for (let w = 0; w < numWeeks; w++) {
  createWeekColumn(w, recipes, soups, CURRENT_SEASON, weeksContainer);
}

  return {
    weeks,
    generatedAt: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
  };
}

// Génère et affiche les deux liens (liste de courses + menus)
async function generateLinks() {
  const btn = document.getElementById("generate-links-btn");
  btn.disabled   = true;
  btn.textContent = "Génération…";

  try {
    if (!currentShoppingState || !shoppingIsSorted) {
      alert("Génère d'abord la liste de courses avant de créer les liens.");
      return;
    }

    const { icons } = await loadIngredientLocations();

    const shoppingUrl = `${location.origin}/shopping.html#${encodeToHash(buildShoppingPayload(currentShoppingState, icons))}`;
    const menusUrl    = `${location.origin}/menus.html#${encodeToHash(buildMenusPayload())}`;

    displayLinks(shoppingUrl, menusUrl);

  } catch (err) {
    console.error("Erreur génération liens :", err);
    alert("Erreur lors de la génération des liens.");
  } finally {
    btn.disabled    = false;
    btn.textContent = "🔗 Générer les liens";
  }
}

// Affiche le panneau de liens et branche les boutons "Copier"
function displayLinks(shoppingUrl, menusUrl) {
  const panel = document.getElementById("links-panel");

  document.getElementById("link-shopping").href        = shoppingUrl;
  document.getElementById("link-shopping").textContent = "→ Ouvrir la liste de courses";
  document.getElementById("link-menus").href           = menusUrl;
  document.getElementById("link-menus").textContent    = "→ Ouvrir les menus";

  document.getElementById("copy-shopping-btn").onclick = () =>
    copyLink(shoppingUrl, document.getElementById("copy-shopping-btn"), "📋 Liste de courses");
  document.getElementById("copy-menus-btn").onclick = () =>
    copyLink(menusUrl, document.getElementById("copy-menus-btn"), "🗓 Menus de la semaine");

  panel.style.display = "block";
  requestAnimationFrame(() => requestAnimationFrame(() =>
    panel.scrollIntoView({ behavior: "smooth", block: "start" })
  ));
}

// Copie un lien dans le presse-papier (format HTML + texte)
async function copyLink(url, btn, label) {
  try {
    await navigator.clipboard.write([new ClipboardItem({
      "text/html":  new Blob([`<a href="${url}">${label}</a>`], { type: "text/html" }),
      "text/plain": new Blob([`${label} : ${url}`],            { type: "text/plain" })
    })]);
    const original  = btn.textContent;
    btn.textContent = "Copié ✅";
    setTimeout(() => { btn.textContent = original; }, 2000);
  } catch (e) {
    console.error(e);
    alert("Impossible de copier");
  }
}


// ============================================================
// DÉMARRAGE
// ============================================================

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

// Génère et affiche la liste de courses triée par lieu
document.getElementById("sort-shopping-btn").addEventListener("click", async () => {
  const container = document.getElementById("shopping-list-container");
  container.classList.remove("hidden");

  const recipesForMail = getAllSelectedRecipesForMail();
  const { locations, icons } = await loadIngredientLocations();
  const shoppingData = buildShoppingData(recipesForMail, locations);

  currentShoppingState = shoppingData;
  shoppingIsSorted     = true;

  renderShoppingList(shoppingData, icons);

  requestAnimationFrame(() => requestAnimationFrame(() =>
    container.scrollIntoView({ behavior: "smooth", block: "start" })
  ));

  const copyBtn = document.getElementById("send-mail-btn");
  if (copyBtn) copyBtn.style.display = "inline-block";
});

document.getElementById("generate-links-btn").addEventListener("click", generateLinks);

startApp();

}); // fin DOMContentLoaded