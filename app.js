// --- Configuration ---
const DAYS_MEALS = [
  { day: "Dimanche", meal: "midi" },
  { day: "Dimanche", meal: "soir" },
  { day: "Lundi", meal: "midi" },
  { day: "Mardi", meal: "midi" },
  { day: "Mercredi", meal: "midi" },
  { day: "Jeudi", meal: "midi" },
  { day: "Vendredi", meal: "midi" },
];

// --- Récupération des recettes depuis ton endpoint serverless ---
async function fetchRecipes() {
  try {
    const res = await fetch("/api/recipes");
    const data = await res.json();

    if (!data || !Array.isArray(data.results)) {
      console.error("Réponse invalide de l'API Notion :", data);
      return [];
    }

    return data.results;
  } catch (err) {
    console.error("Erreur lors du fetch /api/recipes :", err);
    return [];
  }
}

// --- Affichage d’une recette dans un bloc existant ---
function updateRecipeBlock(block, recipe) {
  // Récupération du nom
  const name = recipe?.properties?.Nom?.title[0]?.plain_text || "Sans nom";

  // Récupération de l’icône
  let iconHTML = "";
  if (recipe.icon) {
    if (recipe.icon.type === "emoji") {
      iconHTML = recipe.icon.emoji;
    } else if (recipe.icon.type === "external") {
      iconHTML = `<img src="${recipe.icon.external.url}" alt="" style="width:20px;vertical-align:middle;margin-right:6px;">`;
    }
  }

  // Mise à jour du bloc
  block.querySelector(".icon").innerHTML = iconHTML;
  block.querySelector(".name").textContent = name;
}

// --- Récupère une recette aléatoire ---
function getRandomRecipe(recipes) {
  return recipes[Math.floor(Math.random() * recipes.length)];
}

// --- Génération de l’interface des 7 blocs ---
async function initMenu() {
  const recipes = await fetchRecipes();
  if (!recipes.length) {
    document.getElementById("menu-list").textContent = "Aucune recette disponible";
    return;
  }

  const menuContainer = document.getElementById("menu-list");
  menuContainer.innerHTML = ""; // vide le container

  DAYS_MEALS.forEach((dm, index) => {
    const recipe = getRandomRecipe(recipes);

    const recipeDiv = document.createElement("div");
    recipeDiv.classList.add("menu-item");
    recipeDiv.dataset.index = index;

    // Contenu initial du bloc
    recipeDiv.innerHTML = `
      <span class="day">${dm.day} ${dm.meal}</span>
      <span class="icon"></span>
      <span class="name"></span>
      <button class="modify-btn">Modifier</button>
    `;

    // Ajouter le bloc au container
    menuContainer.appendChild(recipeDiv);

    // Affichage initial de la recette
    updateRecipeBlock(recipeDiv, recipe);

    // Bouton modifier
    recipeDiv.querySelector(".modify-btn").addEventListener("click", () => {
      const newRecipe = getRandomRecipe(recipes);
      updateRecipeBlock(recipeDiv, newRecipe);
    });
  });
}

// --- Démarrage ---
initMenu();
