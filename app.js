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

// --- Récupère une recette aléatoire ---
function getRandomRecipe(recipes) {
  return recipes[Math.floor(Math.random() * recipes.length)];
}

// --- Affichage de la pop-in ingrédients ---
function showIngredients(recipe) {
  const title = recipe?.properties?.Nom?.title[0]?.plain_text || "Sans nom";
  const ingredients = recipe?.properties?.Ingredients?.multi_select || [];

  document.getElementById("popup-title").textContent = title;

  const list = document.getElementById("popup-ingredients");
  list.innerHTML = "";

  ingredients.forEach(ing => {
    const li = document.createElement("li");

    let iconHTML = "🍴";
    if (ing.icon) {
      if (ing.icon.type === "emoji") iconHTML = ing.icon.emoji;
      else if (ing.icon.type === "external") {
        iconHTML = `<img src="${ing.icon.external.url}" alt="" style="width:16px;margin-right:6px;vertical-align:middle;">`;
      }
    }

    li.innerHTML = `${iconHTML} ${ing.name}`;
    list.appendChild(li);
  });

  document.getElementById("recipe-popup").classList.remove("hidden");
}

// --- Affichage d’une recette dans un bloc existant ---
function updateRecipeBlock(block, recipe) {
  const name = recipe?.properties?.Nom?.title[0]?.plain_text || "Sans nom";

  let iconHTML = "";
  if (recipe.icon) {
    if (recipe.icon.type === "emoji") iconHTML = recipe.icon.emoji;
    else if (recipe.icon.type === "external") {
      iconHTML = `<img src="${recipe.icon.external.url}" alt="" style="width:20px;vertical-align:middle;margin-right:6px;">`;
    }
  }

  block.querySelector(".icon").innerHTML = iconHTML;
  block.querySelector(".name").textContent = name;

  // Stocker la recette dans dataset pour la pop-in
  block.dataset.recipe = JSON.stringify(recipe);
}

// --- Initialisation des 7 blocs ---
async function initMenu() {
  const recipes = await fetchRecipes();
  const menuContainer = document.getElementById("menu-list");

  if (!recipes.length) {
    menuContainer.textContent = "Aucune recette disponible";
    return;
  }

  menuContainer.innerHTML = "";

  DAYS_MEALS.forEach((dm, index) => {
    const recipe = getRandomRecipe(recipes);

    const recipeDiv = document.createElement("div");
    recipeDiv.classList.add("menu-item");
    recipeDiv.dataset.index = index;

    recipeDiv.innerHTML = `
      <span class="day">${dm.day} ${dm.meal}</span>
      <span class="icon"></span>
      <span class="name"></span>
      <button class="modify-btn">Modifier</button>
    `;

    menuContainer.appendChild(recipeDiv);

    // Affichage initial
    updateRecipeBlock(recipeDiv, recipe);

    // Clic sur le nom ou l'icône pour afficher la pop-in
    const showPopup = () => {
      const currentRecipe = JSON.parse(recipeDiv.dataset.recipe);
      showIngredients(currentRecipe);
    };
    recipeDiv.querySelector(".name").addEventListener("click", showPopup);
    recipeDiv.querySelector(".icon").addEventListener("click", showPopup);

    // Bouton modifier
    recipeDiv.querySelector(".modify-btn").addEventListener("click", () => {
      const newRecipe = getRandomRecipe(recipes);
      updateRecipeBlock(recipeDiv, newRecipe);
    });
  });
}

// --- Fermeture de la pop-in ---
document.getElementById("popup-close").addEventListen
