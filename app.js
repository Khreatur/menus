const DAYS_MEALS = [
  { day: "Dimanche", meal: "midi" },
  { day: "Dimanche", meal: "soir" },
  { day: "Lundi", meal: "soir" },
  { day: "Mardi", meal: "soir" },
  { day: "Mercredi", meal: "soir" },
  { day: "Jeudi", meal: "soir" },
  { day: "Vendredi", meal: "soir" },
];

function getCurrentSeason() {
  const now = new Date();
  const month = now.getMonth() + 1; // getMonth() renvoie 0-11
  const day = now.getDate();

  // Dates approximatives des saisons dans l’hémisphère nord
  // Printemps : 20 mars – 20 juin
  // Été : 21 juin – 22 septembre
  // Automne : 23 septembre – 20 décembre
  // Hiver : 21 décembre – 19 mars
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
    console.error("Erreur fetch /api/recipes :", err);
    return [];
  }
}

function updateRecipeBlock(block, recipe) {
  const name = recipe?.properties?.Nom?.title[0]?.plain_text || "Sans nom";

  // icône recette
  let iconHTML = "";
  if (recipe.icon) {
    if (recipe.icon.type === "emoji") iconHTML = recipe.icon.emoji;
    else if (recipe.icon.type === "external")
      iconHTML = `<img src="${recipe.icon.external.url}" style="width:20px;vertical-align:middle;margin-right:6px;">`;
  }

  block.querySelector(".icon").innerHTML = iconHTML;
  block.querySelector(".name").textContent = name;

}

let ingredientMap = {}; // global pour lookup

async function fetchIngredientMap() {
  try {
    const res = await fetch("/api/ingredients");
    const data = await res.json();
    if (!data.results) return;

    ingredientMap = {};
    data.results.forEach(ing => {
      ingredientMap[ing.name] = ing.icon || null;
    });
  } catch (err) {
    console.error("Erreur fetch /ingredients :", err);
  }
}


// Pop-in
function showIngredients(recipe) {
  const title = recipe?.properties?.Nom?.title[0]?.plain_text || "Sans nom";
  const ingredients = recipe?.properties?.Ingredients || [];

  document.getElementById("popup-title").textContent = title;

  const list = document.getElementById("popup-ingredients");
  list.innerHTML = "";

  ingredients.forEach(ing => {
    const li = document.createElement("li");

    // lookup dans ingredientMap
    let ingIcon = "";
    const iconData = ingredientMap[ing.name];
    if (iconData) {
      if (iconData.type === "emoji") ingIcon = iconData.emoji;
      else if (iconData.type === "external") {
        ingIcon = `<img src="${iconData.external.url}" style="width:16px;margin-right:6px;vertical-align:middle;">`;
      }
    }

    li.innerHTML = `${ingIcon} ${ing.name}`;
    list.appendChild(li);
  });

  document.getElementById("recipe-popup").classList.remove("hidden");
}


// fermeture pop-in
document.getElementById("popup-close")?.addEventListener("click", () => {
  document.getElementById("recipe-popup").classList.add("hidden");
});

function getRandomRecipe(recipes) {
  return recipes[Math.floor(Math.random() * recipes.length)];
}

function filterRecipesBySeason(recipes, season) {
  return recipes.filter(recipe => {
    const seasons = recipe?.properties?.Saison?.multi_select || [];
    return seasons.some(s => s.name === season);
  });
}

function isSoup(recipe) {
  const categories = recipe.properties?.Categorie?.multi_select || [];
  return categories.some(c => c.name === "SOUPE");
}

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}




// -------- INIT ------------ //
async function initMenu() {
  const allRecipes = await fetchRecipes();
const CURRENT_SEASON = getCurrentSeason();
const recipes = filterRecipesBySeason(allRecipes, CURRENT_SEASON);
const soups = recipes.filter(r =>
  r.properties?.Categorie?.multi_select?.some(c => c.name === "SOUPE")
);


if (!recipes.length) {
  document.getElementById("menu-list").textContent =
    `Aucune recette pour la saison : ${CURRENT_SEASON}`;
  return;
}

  if (!recipes.length) {
    document.getElementById("menu-list").textContent = "Aucune recette disponible";
    return;
  }


  const menuContainer = document.getElementById("menu-list");
  menuContainer.innerHTML = "";

  DAYS_MEALS.forEach((dm, index) => {
    let recipe;

if (CURRENT_SEASON === "Hiver" && index === 1 && soups.length > 0) {
  recipe = getRandomRecipe(soups); // Dimanche soir = soupe
} else {
  recipe = getRandomRecipe(recipes);
}


    const div = document.createElement("div");
    div.classList.add("menu-item");
    div.dataset.index = index;

    div.innerHTML = `
      <div class="header">
        <span class="day">${dm.day} ${dm.meal}</span>
        <span class="icon"></span>
        <span class="name"></span>
        <button class="modify-btn">Modifier</button>
      </div>
    `;

    menuContainer.appendChild(div);

    updateRecipeBlock(div, recipe);

    // clic sur nom ou icône ouvre la pop-in
    div.querySelector(".name").addEventListener("click", () => showIngredients(recipe));
    div.querySelector(".icon").addEventListener("click", () => showIngredients(recipe));

    // bouton modifier
    div.querySelector(".modify-btn").addEventListener("click", () => {
      let newRecipe;

      if (CURRENT_SEASON === "Hiver" && index === 1 && soups.length > 0) {
        newRecipe = getRandomRecipe(soups);
      } else {
        newRecipe = getRandomRecipe(recipes);
      }

      updateRecipeBlock(div, newRecipe);

      div.querySelector(".name").onclick = () => showIngredients(newRecipe);
      div.querySelector(".icon").onclick = () => showIngredients(newRecipe);
    });

  });
}

// démarrage
async function startApp() {
  await fetchIngredientMap(); // populate ingredientMap
  await initMenu();           // puis afficher le menu
}

startApp();

