async function fetchRecipes() {
  try {
    const res = await fetch("/api/recipes");
    const data = await res.json();
    

    // Toujours retourner un tableau, même si data.results est absent
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

function showRecipe(recipe) {
  const name = recipe?.properties?.Nom?.title[0]?.plain_text || "Sans nom";

  let iconHTML = "";

  // Vérifie si la recette a une icône
  if (recipe.icon) {
    if (recipe.icon.type === "emoji") {
      iconHTML = `<span style="margin-right:6px">${recipe.icon.emoji}</span>`;
    } else if (recipe.icon.type === "external") {
      iconHTML = `<img src="${recipe.icon.external.url}" 
                        alt="" 
                        style="width:20px; height:20px; vertical-align:middle; margin-right:6px;">`;
    }
  }

  // Affiche icône + nom
  document.getElementById("recipe").innerHTML = `${iconHTML}${name}`;
}


async function showRandomRecipe() {
  const recipes = await fetchRecipes();

  if (recipes.length === 0) {
    document.getElementById("recipe").textContent = "Aucune recette disponible";
    return;
  }

  const random = recipes[Math.floor(Math.random() * recipes.length)];
  showRecipe(random);
}

document.getElementById("btn").addEventListener("click", showRandomRecipe);

// Chargement initial
showRandomRecipe();
