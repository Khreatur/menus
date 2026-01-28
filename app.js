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
  document.getElementById("recipe").textContent = name;
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
