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

let selectedRecipes = [];
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
let ingredientMap = {}; // global

async function fetchIngredientMap() {
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

// ---------- UPDATE RECIPE BLOCK ---------- //
function updateRecipeBlock(block, recipe) {
  const name = recipe?.properties?.Nom?.title?.[0]?.plain_text || "Sans nom";

  let iconHTML = "";
  if (recipe.icon) {
    if (recipe.icon.type === "emoji") iconHTML = recipe.icon.emoji;
    else if (recipe.icon.type === "external")
      iconHTML = `<img src="${recipe.icon.external.url}" style="width:20px;margin-right:6px;vertical-align:middle;">`;
    else if (recipe.icon.type === "custom_emoji")
    iconHTML = `<img src="${recipe.icon.custom_emoji.url}" style="width:20px;margin-right:6px;vertical-align:middle;">`;
   else if (recipe.icon.type === "file")
    iconHTML = `<img src="${recipe.icon.file.url}" style="width:20px;margin-right:6px;vertical-align:middle;">`;
   
  }

  block.querySelector(".icon").innerHTML = iconHTML;
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

const popup = document.getElementById("recipe-popup");

// fermer la pop-in au clic
popup.onclick = () => {
  popup.classList.add("hidden");
};



// ---------- UTILITAIRES ---------- //



function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // supprime accents
    .trim();
}
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


// ---------- INIT MENU ---------- //
async function initMenu() {
  const allRecipes = await fetchRecipes();
  const CURRENT_SEASON = getCurrentSeason();
  const recipes = filterRecipesBySeason(allRecipes, CURRENT_SEASON);
  const soups = recipes.filter(isSoup);

  if (!recipes.length) {
    document.getElementById("menu-list").textContent =
      `Aucune recette pour la saison : ${CURRENT_SEASON}`;
    return;
  }

  const menuContainer = document.getElementById("menu-list");
  menuContainer.innerHTML = "";
  selectedRecipes = [];
  DAYS_MEALS.forEach((dm, index) => {
    let recipe;
    if (CURRENT_SEASON === "Hiver" && index === 1 && soups.length > 0) {
      recipe = getRandomRecipe(soups); // Dimanche soir = soupe
    } else {
      recipe = getRandomRecipe(recipes);
    }
    selectedRecipes[index] = recipe;


    const div = document.createElement("div");
    div.classList.add("menu-item");
    div.dataset.index = index;

    div.innerHTML = `
      <div class="header">
       <div class="name-wrapper">
        <span class="day">${dm.day} ${dm.meal}</span>
        <span class="icon"></span>
        <span class="name"></span>
        </div>
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
      selectedRecipes[index] = newRecipe;
      updateRecipeBlock(div, newRecipe);
      div.querySelector(".name").onclick = () => showIngredients(newRecipe);
      div.querySelector(".icon").onclick = () => showIngredients(newRecipe);
    });
  });
  console.log("Total recettes Notion :", allRecipes.length);
console.log("Recettes après filtre saison :", recipes.length);
console.log("Recettes SOUPE :", soups.length);
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

function buildShoppingListHTML(locationsMap, iconsMap, recipes) {
  const shopping = {};

  recipes.forEach(r => {
    r.ingredients.forEach(ing => {
      const lieu = locationsMap[ing] || "Lieu inconnu";

      if (!shopping[lieu]) shopping[lieu] = {};
      shopping[lieu][ing] = (shopping[lieu][ing] || 0) + 1;
    });
  });

  const sortedLieux = Object.keys(shopping).sort((a, b) =>
    a.localeCompare(b, 'fr', { sensitivity: 'base' })
  );

  return sortedLieux.map(lieu => {
    const displayLieu = lieu.slice(3); // retire "1 - "
    const items = Object.entries(shopping[lieu])
      .sort(([a], [b]) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

    return `
      <div style="margin-top:16px;">
        <strong>${displayLieu}</strong>
        <ul>
          ${items.map(([ingredient, count]) => {
            const icon = iconsMap[ingredient];
            let iconHtml = "";

            if (icon) {
              if (icon.startsWith("http")) {
                iconHtml = `<img src="${icon}" alt="" style="width:20px;margin-right:6px;vertical-align:middle;">`;
              } else {
                iconHtml = `${icon} `;
              }
            }

            const suffix = count > 1 ? ` (x${count})` : "";

            return `<li>${iconHtml}${ingredient}${suffix}</li>`;
          }).join("")}
        </ul>
      </div>
    `;
  }).join("");
}


function buildClipboardText(locationsMap, recipes) {
  // ---- RECETTES ----
  const recipesText = recipes.map(r => {
  return `${r.nom}\n${r.ingredients.join(", ")}`;
  }).join("\n\n");


  // ---- LISTE DE COURSES ----
  const shopping = {};

recipes.forEach(r => {
  r.ingredients.forEach(ing => {
    const lieu = locationsMap[ing] || "Lieu inconnu";

    if (!shopping[lieu]) shopping[lieu] = {};
    shopping[lieu][ing] = (shopping[lieu][ing] || 0) + 1;
  });
});

  const sortedLieux = Object.keys(shopping).sort((a, b) =>
    a.localeCompare(b, 'fr', { sensitivity: 'base' })
  );

  const shoppingText = sortedLieux.map(lieu => {
  const displayLieu = lieu.slice(3); // retire "1 - "

  const items = Object.entries(shopping[lieu])
    .sort(([a], [b]) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
    .map(([ingredient, count]) =>
      `- ${ingredient}${count > 1 ? ` (x${count})` : ""}`
    )
    .join("\n");

  return `${displayLieu}\n${items}`;
}).join("\n\n");


  return `${getNextMondayLabel()}

RECETTES
========
${recipesText}

LISTE DE COURSES
================
${shoppingText}`;
}




async function sendEmail() {
  try {
    const { locations, icons } = await loadIngredientLocations();
    const recipesForMail = selectedRecipes.map(extractRecipeForEmail);

    // générer HTML
    const recipesHTML = recipesForMail.map(r => `
      <p style="margin-bottom:12px;">
        <strong>${r.nom}</strong><br/>
        ${r.ingredients.join(", ")}
      </p>
    `).join("");

    const shoppingHTML = buildShoppingListHTML(locations, icons, recipesForMail);

    const messageHTML = `
      <div style="font-family: Arial, sans-serif; line-height:1.4;">
        <h2>Recettes sélectionnées</h2>
        ${recipesHTML}

        <hr style="margin:24px 0;" />

        <h2>Liste de courses</h2>
        ${shoppingHTML}
      </div>
    `;

    // envoi du mail
    await emailjs.send(
      "service_yalsbhe",
      "template_ltk6cvx",
      {
        title: getNextMondayLabel(),
        message_html: messageHTML
      }
    );

    // copie dans le presse-papier
    const clipboardText = buildClipboardText(locations, recipesForMail);
    await navigator.clipboard.writeText(clipboardText);
    function openIOSShortcut() {
      const shortcutName = encodeURIComponent("Courses");
      window.location.href = `shortcuts://run-shortcut?name=${shortcutName}`;
    }
    await navigator.clipboard.writeText(buildClipboardText(locations, recipes));
    openIOSShortcut();

  } catch (err) {
    console.error("Erreur lors de l'envoi de l'email :", err);
    alert("Erreur lors de l'envoi de l'email ❌");
  }
}



// ---------- DEMARRAGE ---------- //
async function startApp() {
  const loader = document.getElementById("loader");
  loader.style.display = "block";

  // fetch recettes et ingrédients en parallèle
  const [recipes, _] = await Promise.all([
    fetchRecipes(),
    fetchIngredientMap()
  ]);

  await initMenu(); 

  loader.style.display = "none";
}



startApp();

document.getElementById("send-mail-btn").addEventListener("click", async () => {
  const btn = document.getElementById("send-mail-btn");

  if (!selectedRecipes || selectedRecipes.length === 0) {
    alert("Aucune recette sélectionnée ❌");
    return;
  }

  try {
    btn.disabled = true;
    btn.textContent = "Envoi en cours…";

    await sendEmail();

    btn.textContent = "Mail envoyé ✅";
  } catch {
    btn.textContent = "Envoyer";
    btn.disabled = false;
  }
});

