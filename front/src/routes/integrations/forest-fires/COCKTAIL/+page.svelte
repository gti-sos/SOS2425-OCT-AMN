<script>
    // @ts-check
    import { onMount } from 'svelte';
    import ApexCharts from 'apexcharts';
    import { dev } from '$app/environment';

    const COCKTAIL_API = dev
        ? 'http://localhost:16078/api/proxy/cocktail-stats'
        : 'https://sos2425-OCT-AMN.onrender.com/api/proxy/cocktail-stats';

    let cocktailData = [];
    let chartInstance;
    let chartContainer;
    let cocktailName = 'margarita'; // Puedes cambiar el cóctel aquí

    /**
     * @typedef {{ strIngredient1: string; strIngredient2: string; strIngredient3: string; }} Ingredient
     * @typedef {{ strDrink: string; strDrinkThumb: string; ingredients: Ingredient[] }} Cocktail
     */

    /**
     * Función para obtener datos de cócteles.
     */
    async function fetchCocktailData() {
        try {
            const response = await fetch(COCKTAIL_API + '?s=' + cocktailName);
            if (!response.ok) {
                throw new Error(`Error al obtener datos de cócteles: ${response.status} - ${response.statusText}`);
            }
            const data = await response.json();
            
            // Verificación añadida: si la respuesta `drinks` es null, se asigna un array vacío.
            cocktailData = data.drinks || [];

            if (cocktailData.length === 0) {
                console.warn('La API de cócteles devolvió un array vacío o null.');
            }
        } catch (error) {
            console.error('Fallo al cargar los datos de cócteles:', error);
            cocktailData = [];
        }
    }

    /**
     * Procesa los datos para el formato del gráfico de pastel.
     */
    function processCocktailData() {
        if (!cocktailData || cocktailData.length === 0) {
            return { labels: [], series: [] };
        }

        const ingredientsCount = {};
        
        // Iterar sobre todos los cócteles para contar los ingredientes
        cocktailData.forEach(cocktail => {
            for (let i = 1; i <= 15; i++) {
                const ingredient = cocktail[`strIngredient${i}`];
                if (ingredient) {
                    const normalizedIngredient = ingredient.trim().toLowerCase();
                    ingredientsCount[normalizedIngredient] = (ingredientsCount[normalizedIngredient] || 0) + 1;
                }
            }
        });

        // Convertir el objeto de recuento a arrays para ApexCharts
        const labels = Object.keys(ingredientsCount);
        const series = Object.values(ingredientsCount);

        return { labels, series };
    }

    /**
     * Inicializa y renderiza el gráfico de pastel.
     */
    function initPieChart() {
        const { labels, series } = processCocktailData();

        if (labels.length === 0 || series.length === 0) {
            if (chartContainer) {
                chartContainer.innerHTML = '<div class="error-message">No hay datos suficientes para el gráfico.</div>';
            }
            return;
        }

        const options = {
            series: series,
            chart: {
                type: 'pie',
                height: 500,
                toolbar: { show: true }
            },
            labels: labels,
            title: {
                text: `Ingredientes más comunes en cócteles con "${cocktailName}"`,
                align: 'center'
            },
            legend: {
                position: 'bottom'
            },
            colors: ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0', '#546E7A', '#26a69a']
        };

        if (chartContainer) {
            chartContainer.innerHTML = '';
            chartInstance = new ApexCharts(chartContainer, options);
            chartInstance.render();
        }
    }

    onMount(async () => {
        await fetchCocktailData();
        if (cocktailData.length > 0) {
            initPieChart();
        }
    });
</script>

<svelte:head>
    <title>Uso API: Cócteles</title>
</svelte:head>

<main>
    <h2>Uso API: Cócteles</h2>
    <div class="explanation">
        <p>
            Este gráfico de pastel muestra los ingredientes más comunes en los cócteles, utilizando datos de la API de TheCocktailDB.
        </p>
    </div>

    <div class="chart-container" bind:this={chartContainer}>
        {#if !cocktailData.length}
            <div class="loading">Cargando datos de cócteles...</div>
        {/if}
        {#if cocktailData.length > 0 && processCocktailData().labels.length === 0}
            <div class="error-message">No hay datos procesables para crear el gráfico.</div>
        {/if}
    </div>

    <div class="back-button-container">
    <a href="/graficos/forest-fires" class="back-button-link">
        <button class="back-button">Volver a los gráficos</button>
    </a>
    </div>

    <div class="sources">
        <h3>Fuente de datos:</h3>
        <ul>
            <li>Ingredientes de cócteles: TheCocktailDB</li>
        </ul>
    </div>
</main>

<style>
    main {
        max-width: 1000px;
        margin: 0 auto;
        padding: 20px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        box-sizing: border-box;
        width: 100%;
        overflow-x: hidden;
    }

    h2 {
        color: #2c3e50;
        text-align: center;
        margin-bottom: 1rem;
    }

    .explanation {
        background-color: #f7fbf7;
        padding: 20px;
        border-radius: 10px;
        border-left: 5px solid #c4302b;
        margin-bottom: 30px;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
    }

    .chart-container {
        height: 500px;
        margin: 30px 0;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        padding: 20px;
        position: relative;
    }

    .loading, .error-message {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        font-size: 18px;
        color: #666;
        text-align: center;
        padding: 10px;
    }

    .error-message {
        color: #d32f2f;
        border: 1px solid #d32f2f;
        background-color: #ffebee;
        border-radius: 5px;
    }

    .sources {
        background-color: #f5f5f5;
        padding: 20px;
        border-radius: 8px;
        margin: 30px 0;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .sources ul {
        list-style-type: none;
        padding-left: 0;
    }

    .sources li {
        margin-bottom: 10px;
        padding-left: 20px;
        position: relative;
    }

    .sources li:before {
        content: '•';
        color: #c4302b;
        font-weight: bold;
        position: absolute;
        left: 0;
    }

    .back-button-container {
        display: flex;
        justify-content: center;
        margin-top: 2rem;
        margin-bottom: 2rem;
    }

    .back-button {
        padding: 0.75rem 1.5rem;
        font-size: 1.1rem;
        cursor: pointer;
        border: none;
        border-radius: 6px;
        background-color: #a8c686;
        color: #000;
        transition: background-color 0.3s ease, transform 0.2s ease;
    }

    .back-button:hover {
        background-color: #9bb37c;
        transform: translateY(-2px);
    }

    .back-button:active {
        background-color: #8da06b;
        transform: translateY(0);
    }

</style>