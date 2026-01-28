// Les jours + repas
const SLOTS = [
  "Dimanche midi",
  "Dimanche soir",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi"
];

let recipesCache = []; // Cache côté client pour éviter de fetch à chaque clic

// Récupération des recettes depuis l'API
async function fetchRecipes() {
  try {
    const res = await fetch("/api/recipes");
    const data = await res.json();
    if (!data || !Array.isArray(data.results)) return [];
    return data.results;
  } catch (err) {
    console.error("Erreur fetch /api/recipes :", err);
    return [];
  }
}

// Retourne une recette aléatoire
function getRandomRecipe() {
  if (!recipesCache.length) return null;
  const index = Math.floor(Math.random() * recipesCache.length);
  return recipesCache[index];
}

// Génère l'HTML de la recette
function renderMenuItem(slot, recipe, index) {
  const name = recipe?.properties?.Nom?.title[0]?.plain_text || "Sans nom";

  return `
    <div class="menu-item" data-index="${index}">
      <div class="left">
        <strong>${slot}</strong>
        <span>${name}</span>
      </div>
      <button class="modify-btn">Modifier</button>
    </div>
  `;
}

// Affiche toutes les recettes
async function showMenu() {
  recipesCache = await fetchRecipes();
  const menuList = document.getElementById("menu-list");

  // Génère 7 recettes initiales
  let html = "";
  for (let i = 0; i < 7; i++) {
    const recipe = getRandomRecipe();
    html += renderMenuItem(SLOTS[i], recipe, i);
  }
  menuList.innerHTML = html;

  // Ajoute le listener sur chaque bouton "modifier"
  document.querySelectorAll(".modify-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const parent = e.target.closest(".menu-item");
      const index = parent.dataset.index;
      const newRecipe = getRandomRecipe();
      parent.querySelector(".left span").textContent =
        newRecipe?.properties?.Nom?.title[0]?.plain_text || "Sans nom";
    });
  });
}

// Chargement initial
showMenu();
