document.addEventListener("DOMContentLoaded", () => {
// DEV MODE
const USE_MOCK_DATA = true;

// ---------- CONSTANTES ---------- //
const DAYS_MEALS = [
  { day: "Dimanche", meal: "midi" },
  { day: "Dimanche", meal: "soir" },
  { day: "Lundi", meal: "soir" },
  { day: "Mardi", meal: "soir" },
  { day: "Mercredi", meal: "soir" },
  { day: "Jeudi", meal: "soir" },
  { day: "Vendredi", meal: "soir" },
];

let selectedRecipes = {}; 
let excludedRecipeIds = new Set();
let ingredientMap = {}; // global
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
        { name: "Pâtes" },
        { name: "Lardons" },
        { name: "Œufs" },
        { name: "Parmesan" },
        { name: "Poivre" }
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
        { name: "Salade romaine" },
        { name: "Poulet" },
        { name: "Parmesan" },
        { name: "Croûtons" },
        { name: "Sauce césar" }
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
        { name: "Carottes" },
        { name: "Poireaux" },
        { name: "Pommes de terre" },
        { name: "Oignon" }
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
        { name: "Pois chiches" },
        { name: "Lait de coco" },
        { name: "Curry" },
        { name: "Oignon" },
        { name: "Riz" }
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
        { name: "Saumon" },
        { name: "Citron" },
        { name: "Aneth" },
        { name: "Pommes de terre" }
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

  if ((month === 3 && day >= 20) || (month > 3 && month < 6) || (month === 6 && day <= 20)) {
    return "Printemps";
  } else if ((month === 6 && day >= 21) || (month > 6 && month < 9) || (month === 9 && day <= 22)) {
    return "Été";
  } else if ((month === 9 && day >= 23) || (month > 9 && month < 12) || (month === 12 && day <= 20)) {
    return "Automne";
  } else {
    return "Hiver";
  }
}

// ---------- FETCH RECIPES ---------- //
async function fetchRecipes() {
  if (USE_MOCK_DATA) return MOCK_RECIPES;
  else{
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
}

// ---------- FETCH INGREDIENT MAP ---------- //


async function fetchIngredientMap() {
  if (USE_MOCK_DATA) {
    ingredientMap = {};
    MOCK_INGREDIENTS.forEach(i => {
      ingredientMap[i.name] = i.icon?.emoji || null;
    });
    return;}
    else{
  try {
    const res = await fetch("/api/ingredients");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data.results)) return {};

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

// fermer la pop-in au clic
popup.onclick = () => {
  popup.classList.add("hidden");
};



// ---------- UTILITAIRES ---------- //

function listenOnce(onResult, onError) {
  if (!SpeechRecognition) {
    alert("Reconnaissance vocale non supportée");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "fr-FR";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = e => {
    const text = e.results[0][0].transcript;
    onResult(text);
  };

  recognition.onerror = e => {
    onError(e);
  };

  recognition.start();
}
function getAllSelectedRecipesForMail() {
  return Object.values(selectedRecipes)
    .flat()
    .map(extractRecipeForEmail);
}

function buildClipboardHTML(locationsMap, recipesForMail) {
  const recipesHTML = recipesForMail.map((r, index) => {
    const slot = DAYS_MEALS[index];
    const label = slot ? `${slot.day} ${slot.meal}` : "Jour inconnu";

    return `
      <p>
        <strong>${label} : ${r.nom}</strong><br>
        <span style="font-weight: normal;">
          ${r.ingredients.join(", ")}
        </span>
      </p>
    `;
  }).join("");

  const shopping = {};

  recipesForMail.forEach(r => {
    r.ingredients.forEach(ing => {
      const lieu = locationsMap[ing] || "Lieu inconnu";
      if (!shopping[lieu]) shopping[lieu] = {};
      shopping[lieu][ing] = (shopping[lieu][ing] || 0) + 1;
    });
  });

  const sortedLieux = Object.keys(shopping).sort((a, b) =>
    a.localeCompare(b, "fr", { sensitivity: "base" })
  );

  const shoppingHTML = sortedLieux.map(lieu => {
    const displayLieu = lieu.slice(3);
    const items = Object.entries(shopping[lieu])
      .sort(([a], [b]) => a.localeCompare(b, "fr", { sensitivity: "base" }))
      .map(([ing, count]) =>
        `- ${ing}${count > 1 ? ` (x${count})` : ""}`
      )
      .join("<br>");

    return `
      <p>
        <strong>${displayLieu}</strong><br>
        <span style="font-weight: normal;">
          ${items}
        </span>
      </p>
    `;
  }).join("");

  return `
    <h3>${getNextMondayLabel()}</h3>
    <br>
    <h4>RECETTES</h4>
    <br>
    ${recipesHTML}
    <br>
    <h4>LISTE DE COURSES</h4>
    <br>
    ${shoppingHTML}
  `;
}


async function copyToClipboardHTML(html, fallbackText) {
  const item = new ClipboardItem({
    "text/html": new Blob([html], { type: "text/html" }),
    "text/plain": new Blob([fallbackText], { type: "text/plain" }) // sécurité
  });

  await navigator.clipboard.write([item]);
}


function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // supprime accents
    .replace(/[^a-z\s]/g, "")
    .trim();
}
function getRandomRecipe(recipes) {
  const available = recipes.filter(r => !excludedRecipeIds.has(r.id));

  if (available.length === 0) {
    return null; // plus rien de dispo
  }

  return available[Math.floor(Math.random() * available.length)];
}
function filterRecipesBySeason(recipes, season) {
  return recipes.filter(recipe => {
    const seasons = recipe?.properties?.Saison?.multi_select || [];
    return seasons.some(s => s.name === season);
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
function getNextMondayLabel() {
  const today = new Date();
  const day = today.getDay(); // 0 = dimanche

  const daysUntilNextMonday = (8 - day) % 7 || 7;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilNextMonday);

  const options = { day: "numeric", month: "long" };
  const formattedDate = nextMonday.toLocaleDateString("fr-FR", options);

  return `Menus de la semaine du ${formattedDate}`;
}
function scoreRecipe(spoken, recipeName) {
  const spokenWords = normalize(spoken).split(" ");
  const recipeWords = normalize(recipeName).split(" ");

  let score = 0;

  spokenWords.forEach(word => {
    if (recipeWords.includes(word)) {
      // bonus fort pour mots longs (discriminants)
      score += word.length >= 6 ? 5 : 2;
    }
  });

  // bonus si la phrase complète est incluse
  if (normalize(recipeName).includes(normalize(spoken))) {
    score += 10;
  }

  // pénalité si le nom est très long
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

    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  });

  return bestScore > 0 ? best : null;
}
function stopMic(micBtn, micTimeout) {
  if (micTimeout) clearTimeout(micTimeout);
  micBtn.src = MIC_BLACK_SRC;
  micBtn.classList.remove("listening");
}



// ---------- AJOUTER RECETTES --------- //

function addRecipeLine(container, recipe, dayIndex) {


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

micBtn.onclick = (e) => {
  e.stopPropagation();
  micBtn.src = MIC_GREEN_SRC;
  micBtn.classList.add("listening");

 micTimeout = setTimeout(() => {
  stopMic(micBtn, micTimeout);
}, 8000);

  listenOnce(
    spokenText => {
      stopMic(micBtn, micTimeout);

      const newRecipe = findClosestRecipe(spokenText, allRecipesCache);

      if (!newRecipe) {
        alert(`Aucune recette trouvée pour "${spokenText}"`);
        return;
      }

      const idx = selectedRecipes[dayIndex].indexOf(recipe);
      selectedRecipes[dayIndex][idx] = newRecipe;

      updateRecipeBlock(line, newRecipe);

      line.querySelector(".name").onclick = () => showIngredients(newRecipe);
      line.querySelector(".icon-recette").onclick = () => showIngredients(newRecipe);

      recipe = newRecipe;
    },
    error => {
 stopMic(micBtn, micTimeout);

      console.error("Erreur reconnaissance vocale", error);
      // 👉 retour en noir même en cas d’erreur
      micBtn.src = MIC_BLACK_SRC;
      micBtn.classList.remove("listening");
    }
  );
};


  container.appendChild(line);
  updateRecipeBlock(line, recipe);

  // pop-in ingrédients
  line.querySelector(".name").onclick = () => showIngredients(recipe);
  line.querySelector(".icon-recette").onclick = () => showIngredients(recipe);


  // bouton modifier
line.querySelector(".icon-change").onclick = (e) => {
  e.stopPropagation();
  excludedRecipeIds.add(recipe.id);

const isSundaySoup =
  DAYS_MEALS[dayIndex].day === "Dimanche" &&
  DAYS_MEALS[dayIndex].meal === "soir" &&
  getCurrentSeason() === "Hiver";

const source = isSundaySoup
  ? allRecipesCache.filter(isSoup)
  : allRecipesCache;

const available = source.filter(r =>
  !excludedRecipeIds.has(r.id)
);


  if (!available.length) {
    alert("Plus de recettes disponibles");
    return;
  }

  const newRecipe = getRandomRecipe(available);

  const idx = selectedRecipes[dayIndex].indexOf(recipe);
  selectedRecipes[dayIndex][idx] = newRecipe;

  updateRecipeBlock(line, newRecipe);

  // rebind des clics
  line.querySelector(".name").onclick = () => showIngredients(newRecipe);
  line.querySelector(".icon-recette").onclick = () => showIngredients(newRecipe);

  recipe = newRecipe;
};
// bouton supprimer
line.querySelector(".icon-trash").onclick = (e) => {
  e.stopPropagation();
  // retirer du state
  selectedRecipes[dayIndex] = selectedRecipes[dayIndex].filter(
    r => r.id !== recipe.id
  );

  // optionnel : rendre la recette à nouveau disponible
  excludedRecipeIds.delete(recipe.id);

  // retirer du DOM
  line.remove();
};


}

// ---------- INIT MENU ---------- //
async function initMenu() {
  const menuContainer = document.getElementById("menu-list");
  if (!menuContainer) {
    console.error("menu-list introuvable ! Impossible d'afficher le menu.");
    return;
  }

  const allRecipes = await fetchRecipes();
  const CURRENT_SEASON = getCurrentSeason();
  const recipes = filterRecipesBySeason(allRecipes, CURRENT_SEASON);
  allRecipesCache = recipes;
  const soups = recipes.filter(isSoup);

  if (!recipes.length) {
    menuContainer.textContent = `Aucune recette pour la saison : ${CURRENT_SEASON}`;
    return;
  }

  menuContainer.innerHTML = "";
  selectedRecipes = [];

  DAYS_MEALS.forEach((dm, index) => {
    // 1. choisir la recette initiale
    let recipe;
    if (CURRENT_SEASON === "Hiver" && index === 1 && soups.length > 0) {
      recipe = getRandomRecipe(soups);
    } else {
      recipe = getRandomRecipe(recipes);
    }

    // 2. selectedRecipes = TOUJOURS un tableau
    selectedRecipes[index] = [recipe];

    // 3. créer le bloc du jour
    const div = document.createElement("div");
    div.classList.add("menu-item");
    div.dataset.index = index;

    div.innerHTML = `
      <div class="day-label">${dm.day} ${dm.meal}</div>
      <div class="recipes-container"></div>
      <button class="add-recipe-btn">+ Ajouter un item</button>
    `;

    menuContainer.appendChild(div);

    // 4. récupérer le conteneur recettes et bouton ajouter
    const recipesContainer = div.querySelector(".recipes-container");
    const addBtn = div.querySelector(".add-recipe-btn");

    if (addBtn) {
      addBtn.onclick = () => {
        const isSundaySoup =
          DAYS_MEALS[index].day === "Dimanche" &&
          DAYS_MEALS[index].meal === "soir" &&
          getCurrentSeason() === "Hiver";

        const source = isSundaySoup
          ? allRecipesCache.filter(isSoup)
          : allRecipesCache;

        const available = source.filter(r => !excludedRecipeIds.has(r.id));

        if (!available.length) {
          alert("Plus de recettes disponibles");
          return;
        }

        const newRecipe = getRandomRecipe(available);

        // exclure immédiatement pour éviter doublons
        excludedRecipeIds.add(newRecipe.id);

        // ajouter dans le modèle
        selectedRecipes[index].push(newRecipe);

        // ajouter dans l’UI
        addRecipeLine(recipesContainer, newRecipe, index);
      };
    }

    // 5. AFFICHER toutes les recettes du jour
    selectedRecipes[index].forEach(r => {
      addRecipeLine(recipesContainer, r, index);
    });
  });
}

// ----- PREPARATION DU MAIL -------- //
async function loadIngredientLocations() {
  try {
    const res = await fetch("/api/ingredients"); 
    if (!res.ok) throw new Error("Impossible de charger les ingrédients depuis Notion");

    const data = await res.json();

    const map = {}; // map lieux
    const icons = {}; // map icônes

    data.results.forEach(ing => {
      if (!ing.name) return;

      map[ing.name] = ing.lieu || "Lieu inconnu";

      if (ing.icon?.type === "emoji") icons[ing.name] = ing.icon.emoji;
      else if (ing.icon?.type === "custom_emoji") icons[ing.name] = ing.icon.custom_emoji.url;
      else if (ing.icon?.type === "external") icons[ing.name] = ing.icon.external.url;
      else if (ing.icon?.type === "file") icons[ing.name] = ing.icon.file.url;
      else icons[ing.name] = null;
    });

    return { locations: map, icons: icons };
  } catch (err) {
    console.error("Erreur loadIngredientLocations :", err);
    return { locations: {}, icons: {} };
  }
}




// ---------- DEMARRAGE ---------- //

  

async function startApp() {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "block";

  try {
    // fetch recettes et ingrédients en parallèle
    const [recipes, _] = await Promise.all([
      fetchRecipes(),
      fetchIngredientMap()
    ]);

    await initMenu(); 

  } catch (err) {
    console.error("Erreur au démarrage de l'app :", err);
  } finally {
    if (loader) loader.style.display = "none";
  }
}






document.getElementById("send-mail-btn").addEventListener("click", async () => {
  const btn = document.getElementById("send-mail-btn");

  if (!selectedRecipes || selectedRecipes.length === 0) {
    alert("Aucune recette sélectionnée ❌");
    return;
  }

  try {
    btn.disabled = true;
    btn.textContent = "Copie en cours...";

    // ✅ CLIPBOARD ICI (synchronisé avec le clic)
    const recipesForMail = getAllSelectedRecipesForMail();
    const { locations } = await loadIngredientLocations();
    const clipboardText = buildClipboardHTML(locations, recipesForMail);
const clipboardHTML = buildClipboardHTML(locations, recipesForMail);

await copyToClipboardHTML(clipboardHTML, clipboardText);


    // ensuite seulement
    //await sendEmail(false); // 👈 on enlève la copie dedans

    btn.textContent = "Liste de course copiée ✅";
  } catch (err) {
    console.error(err);
    btn.textContent = "Copier la liste";
    btn.disabled = false;
  }
});

  startApp();

});

