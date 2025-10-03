<script>
    // @ts-check
    import { onMount } from 'svelte';
    import { dev } from '$app/environment';
    import * as echarts from 'echarts';

    const COVID_API = dev
        ? 'http://localhost:16078/api/proxy/covid-stats'
        : 'https://sos2425-OCT-AMN.onrender.com/api/proxy/covid-stats';

    let covidData = [];
    let chartInstance;
    let chartContainer;
    let country = 'spain';

    /**
     * Función para obtener datos de casos de COVID-19.
     */
    async function fetchCovidData() {
        try {
            const response = await fetch(COVID_API + '?country=' + country);
            if (!response.ok) {
                throw new Error(`Error al obtener datos de COVID-19: ${response.status} - ${response.statusText}`);
            }
            covidData = await response.json();
            
            if (covidData.length === 0) {
                console.warn('La API de COVID-19 devolvió un array vacío.');
            }
        } catch (error) {
            console.error('Fallo al cargar los datos de COVID-19:', error);
            covidData = [];
        }
    }

    /**
     * Procesa los datos para el formato del Gráfico de Embudo (Funnel).
     * Creamos una serie de 5 pasos representativos de los días necesarios para
     * alcanzar distintos porcentajes de los casos totales acumulados.
     */
    function processCovidData() {
        if (!covidData || covidData.length === 0) {
            return [];
        }
        
        let cumulativeCases = 0;
        const totalCases = covidData.reduce((sum, item) => sum + item.Cases, 0);

        // Puntos de control: 20%, 40%, 60%, 80%, 100% de los casos totales
        const controlPoints = [0.2, 0.4, 0.6, 0.8, 1.0];
        const funnelData = [];
        
        // Iteramos sobre los porcentajes de control
        controlPoints.forEach((targetRatio, index) => {
            const targetCases = totalCases * targetRatio;
            let currentCumulative = 0;
            let dayCount = 0;

            // Buscamos el punto temporal (número de días) donde se alcanzó esa marca
            for (let i = 0; i < covidData.length; i++) {
                currentCumulative += covidData[i].Cases;
                if (currentCumulative >= targetCases) {
                    dayCount = i + 1;
                    break;
                }
            }

            // El valor (tamaño) del embudo es el número de días transcurridos
            funnelData.push({
                value: dayCount, 
                name: `${(targetRatio * 100).toFixed(0)}% Casos (Días: ${dayCount})`
            });
        });
        
        // El Funnel requiere los datos ordenados de mayor a menor valor para el correcto efecto visual.
        funnelData.sort((a, b) => b.value - a.value);

        return funnelData;
    }

    /**
     * Inicializa y renderiza el Gráfico de Embudo.
     */
    function initFunnelChart() {
        const data = processCovidData();

        if (data.length === 0) {
            if (chartContainer) {
                chartContainer.innerHTML = '<div class="error-message">No hay datos suficientes para el gráfico.</div>';
            }
            return;
        }

        if (chartContainer) {
            chartContainer.innerHTML = ''; 

            const chart = echarts.init(chartContainer);

            const options = {
                title: {
                    text: `Días para alcanzar el % de Casos Acumulados en ${country.charAt(0).toUpperCase() + country.slice(1)}`,
                    left: 'center'
                },
                tooltip: {
                    trigger: 'item',
                    formatter: '{b}: {c} días'
                },
                series: [
                    {
                        name: 'Casos Acumulados',
                        type: 'funnel',
                        left: '10%',
                        top: 60,
                        bottom: 60,
                        width: '80%',
                        min: 0,
                        max: data[0].value, // Usamos el valor más alto como el máximo del embudo
                        sort: 'none',
                        data: data
                    }
                ]
            };

            chart.setOption(options);
            chartInstance = chart;

            // Manejar redimensionamiento
            window.addEventListener('resize', () => chart.resize());
        }
    }

    onMount(async () => {
        await fetchCovidData();
        if (covidData.length > 0) {
            initFunnelChart();
        }
        
        // Cleanup al destruir el componente
        return () => {
            if (chartInstance) {
                chartInstance.dispose();
                window.removeEventListener('resize', chart.resize);
            }
        };
    });
</script>

<svelte:head>
    <title>Uso API: Casos de COVID-19</title>
</svelte:head>

<main>
    <h2>Uso API: Casos de COVID-19</h2>
    <div class="explanation">
        <p>
            Este gráfico de embudo muestra la evolución de los casos de COVID-19 en España, utilizando datos de la API de COVID-19.
        </p>
    </div>

    <div class="chart-container" bind:this={chartContainer}>
        {#if !covidData.length}
            <div class="loading">Cargando datos de COVID-19...</div>
        {/if}
        {#if covidData.length > 0 && processCovidData().length === 0}
            <div class="error-message">No hay datos procesables para crear el gráfico.</div>
        {/if}
    </div>

    <div class="back-button-container">
    <a href="/integrations" class="back-button-link">
        <button class="back-button">Volver a Integraciones</button>
    </a>
    </div>

    <div class="sources">
        <h3>Fuente de datos:</h3>
        <ul>
            <li>Estadísticas de COVID-19: COVID19 API</li>
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