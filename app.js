// Jours et repas
const slots = [
  "Dimanche midi",
  "Dimanche soir",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi"
];

// Cache des recettes pour réutilisation
let recipesCache = [];

// Conteneur principal dans le DOM
const menuContainer = document.getElementById("menu-list");

// --- Fetch Notion ---
async function fetchRecipes() {
  try {
    const res = await fetch("/api/recipes");
    const data = await res.json();

    if (!data || !Array.isArray(data.results)) {
      console.error("Réponse invalide de l'API Notion :", data);
      return [];
    }

    recipesCache = data.results;
    return recipesCache;
  } catch (err) {
    console.error("Erreur lors du fetch /api/recipes :", err);
    return [];
  }
}

// --- Génère le HTML d'une recette avec icône ---
function buildRecipeHTML(slot, recipe, index) {
  const name = recipe?.properties?.Nom?.title[0]?.plain_text || "Sans nom";

  let iconHTML = "";
  if (recipe.icon) {
    if (recipe.icon.type === "emoji") {
      iconHTML = `<span style="margin-right:6px;">${recipe.icon.emoji}</span>`;
    } else if (recipe.icon.type === "external") {
      iconHTML = `<img src="${recipe.icon.external.url}" alt="" style="width:20px; vertical-align:middle; margin-right:6px;">`;
    }
  }

  return `
    <div class="menu-item" data-index="${index}">
      <div class="left">
        <strong>${slot}</strong> : <span>${iconHTML}${name}</span>
      </div>
      <button class="modify-btn">Modifier</button>
    </div>
  `;
}

// --- Affiche toutes les recettes de la semaine ---
async function renderMenu() {
  const recipes = await fetchRecipes();
  if (!recipes.length) {
    menuContainer.innerHTML = "<p>Aucune recette disponible</p>";
    return;
  }

  menuContainer.innerHTML = slots.map((slot, index) => {
    const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
    return buildRecipeHTML(slot, randomRecipe, index);
  }).join("");
}

// --- Gestion du clic sur "Modifier" ---
menuContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("modify-btn")) {
    const menuItem = e.target.closest(".menu-item");
    const index = Number(menuItem.dataset.index);

    // Nouvelle recette aléatoire
    const randomRecipe = recipesCache[Math.floor(Math.random() * recipesCache.length)];

    // Remplace le HTML de la div
    menuItem.innerHTML = buildRecipeHTML(slots[index], randomRecipe, index).trim();
  }
});

// --- Initialisation ---
renderMenu();
