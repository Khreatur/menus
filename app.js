async function fetchRecipes() {
  const res = await fetch("/api/recipes");
  const data = await res.json();
  return data.results;
}

function showRecipe(recipe) {
  const name = recipe.properties.Nom.title[0]?.plain_text || "Sans nom";
  document.getElementById("recipe").textContent = name;
}

async function showRandomRecipe() {
  const recipes = await fetchRecipes();
  if (!recipes.length) return;

  const random = recipes[Math.floor(Math.random() * recipes.length)];
  showRecipe(random);
}

document.getElementById("btn").addEventListener("click", showRandomRecipe);
showRandomRecipe();
