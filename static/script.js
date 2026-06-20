let allRecipes = [];

const views = {
    list: document.getElementById('view-list'),
    add: document.getElementById('view-add'),
    detail: document.getElementById('view-detail')
};

const navBtns = {
    list: document.getElementById('nav-list-btn'),
    add: document.getElementById('nav-add-btn')
};

const recipesGrid = document.getElementById('recipes-grid');
const recipeForm = document.getElementById('recipe-form');
const searchInput = document.getElementById('search-input');

function showView(viewName) {
    Object.values(views).forEach(view => view.classList.add('hidden'));
    views[viewName].classList.remove('hidden');

    Object.values(navBtns).forEach(btn => btn.classList.remove('active'));
    if (navBtns[viewName]) {
        navBtns[viewName].classList.add('active');
    }

    if (viewName === 'list') {
        fetchRecipes();
    }
}

document.getElementById('logo-btn').addEventListener('click', () => showView('list'));
navBtns.list.addEventListener('click', () => showView('list'));
navBtns.add.addEventListener('click', () => {
    recipeForm.reset();
    showView('add');
});
document.getElementById('cancel-add-btn').addEventListener('click', () => showView('list'));
document.getElementById('back-to-list-btn').addEventListener('click', () => showView('list'));

async function fetchRecipes() {
    recipesGrid.innerHTML = '<div class="loading">Ładowanie przepisów...</div>';
    try {
        const response = await fetch('/api/recipes');
        if (!response.ok) throw new Error('Błąd pobierania danych');

        allRecipes = await response.json();
        renderRecipes(allRecipes);
    } catch (error) {
        recipesGrid.innerHTML = `<div class="error-msg">Nie udało się pobrać przepisów. Sprawdź czy baza danych i serwer Flask działają!</div>`;
        console.error(error);
    }
}

function renderRecipes(recipes) {
    if (recipes.length === 0) {
        recipesGrid.innerHTML = '<div class="no-data">Brak przepisów w Twojej książce. Dodaj pierwszy przepis!</div>';
        return;
    }

    recipesGrid.innerHTML = recipes.map(recipe => {
        const ingredientsPreview = recipe.ingredients.split('\n').slice(0, 3).join(', ');
        const hasMoreIngredients = recipe.ingredients.split('\n').length > 3;

        return `
            <div class="recipe-card" onclick="viewRecipeDetails(${recipe.id})">
                <h3>${escapeHTML(recipe.title)}</h3>
                <div class="card-ingredients">
                    <strong>Składniki:</strong> ${escapeHTML(ingredientsPreview)}${hasMoreIngredients ? '...' : ''}
                </div>
                <span class="card-link">Zobacz przepis →</span>
            </div>
        `;
    }).join('');
}

async function viewRecipeDetails(id) {
    showView('detail');

    document.getElementById('detail-title').innerText = 'Ładowanie...';
    document.getElementById('detail-ingredients').innerHTML = '';
    document.getElementById('detail-instructions').innerHTML = '';

    try {
        const response = await fetch(`/api/recipes/${id}`);
        if (!response.ok) throw new Error('Nie znaleziono przepisu');

        const recipe = await response.json();

        document.getElementById('detail-title').innerText = recipe.title;

        const date = new Date(recipe.created_at).toLocaleDateString('pl-PL', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        document.getElementById('detail-date').innerText = `Dodano: ${date}`;

        const ingredientsHTML = recipe.ingredients.split('\n')
            .filter(item => item.trim() !== '')
            .map((item, idx) => `
                <li>
                    <label class="checkbox-container">
                        <input type="checkbox" id="ing-${idx}">
                        <span class="checkmark"></span>
                        <span class="item-text">${escapeHTML(item)}</span>
                    </label>
                </li>
            `).join('');
        document.getElementById('detail-ingredients').innerHTML = ingredientsHTML;

        const instructionsHTML = recipe.instructions.split('\n')
            .filter(paragraph => paragraph.trim() !== '')
            .map(paragraph => `<p>${escapeHTML(paragraph)}</p>`).join('');
        document.getElementById('detail-instructions').innerHTML = instructionsHTML;

        const copyBtn = document.getElementById('copy-recipe-btn');
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(recipe.instructions)
                .then(() => {
                    const originalText = copyBtn.innerText;
                    copyBtn.innerText = 'Skopiowano! ✓';
                    copyBtn.classList.add('copied');
                    setTimeout(() => {
                        copyBtn.innerText = originalText;
                        copyBtn.classList.remove('copied');
                    }, 2000);
                });
        };

    } catch (error) {
        document.getElementById('detail-title').innerText = 'Błąd';
        document.getElementById('detail-instructions').innerHTML = '<p class="error-msg">Nie udało się pobrać szczegółów przepisu.</p>';
        console.error(error);
    }
}

recipeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const recipeData = {
        title: document.getElementById('recipe-title').value.trim(),
        ingredients: document.getElementById('recipe-ingredients').value.trim(),
        instructions: document.getElementById('recipe-instructions').value.trim()
    };

    try {
        const response = await fetch('/api/recipes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(recipeData)
        });

        if (!response.ok) {
            let errMsg = 'Wystąpił błąd podczas dodawania przepisu';
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const errData = await response.json();
                errMsg = errData.error || errMsg;
            } else {
                errMsg = `Błąd serwera (status ${response.status}). Upewnij się, że tabela w bazie danych została utworzona!`;
            }
            throw new Error(errMsg);
        }

        alert('Przepis został pomyślnie dodany!');
        recipeForm.reset();
        showView('list');
    } catch (error) {
        alert(error.message);
        console.error(error);
    }
});

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filteredRecipes = allRecipes.filter(recipe =>
        recipe.title.toLowerCase().includes(query) ||
        recipe.ingredients.toLowerCase().includes(query)
    );
    renderRecipes(filteredRecipes);
});

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

fetchRecipes();