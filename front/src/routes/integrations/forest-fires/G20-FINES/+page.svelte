<script>
    // @ts-check
    import { onMount } from 'svelte';
    import ApexCharts from 'apexcharts';
    import { dev } from '$app/environment';

    // URL para la API de multas de tráfico.
    const FINES_API = dev
        ? 'http://localhost:16078/api/v1/proxy/fines'
        : 'https://sos2425-20.onrender.com/api/v1/proxy/fines';

    let finesData = [];
    let chartInstance;
    let chartContainer; 

    /**
     * Función para obtener datos de la API de Multas de Tráfico.
     */
    async function fetchFinesData() {
        try {
            const response = await fetch(FINES_API);
            if (!response.ok) {
                throw new Error(`Error al obtener datos de multas: ${response.status} - ${response.statusText}`);
            }
            finesData = await response.json();
            console.log('Datos de Multas:', finesData);

        } catch (error) {
            console.error('Fallo al cargar los datos de multas:', error);
            finesData = [];
        }
    }

    /**
     * Procesa los datos para el gráfico, extrayendo las ciudades y las series de datos.
     */
    function processFinesData() {
        if (!finesData || finesData.length === 0) {
            return { cities: [], itvFines: [], alcoholFines: [], radarFines: [] };
        }

        // Ordenamos los datos por ciudad para una visualización consistente
        finesData.sort((a, b) => a.city.localeCompare(b.city));

        const cities = finesData.map(item => item.city);
        const itvFines = finesData.map(item => item.itv);
        const alcoholFines = finesData.map(item => item.alcohol_rate);
        const radarFines = finesData.map(item => item.fixed_radar);

        return { cities, itvFines, alcoholFines, radarFines };
    }

    /**
     * Inicializa y renderiza el gráfico de columnas apiladas usando ApexCharts.
     */
    function initStackedColumnChart() {
        if (!finesData || finesData.length === 0) {
            console.error('No hay datos disponibles para el gráfico de multas.');
            return;
        }

        const { cities, itvFines, alcoholFines, radarFines } = processFinesData();

        if (cities.length === 0) {
            if (chartContainer) {
                chartContainer.innerHTML = '<div class="error-message">No hay datos suficientes para crear el gráfico de multas.</div>';
            }
            return;
        }

        // Configuración del gráfico de columnas apiladas
        const options = {
            series: [
                {
                    name: 'Multas por ITV',
                    data: itvFines
                },
                {
                    name: 'Multas por Alcoholemia',
                    data: alcoholFines
                },
                {
                    name: 'Multas por Radar Fijo',
                    data: radarFines
                }
            ],
            chart: {
                type: 'bar', 
                height: 500,
                stacked: true, // Apilado para garantizar unicidad
                toolbar: { show: true },
                zoom: { enabled: true }
            },
            plotOptions: {
                bar: {
                    horizontal: false, 
                },
            },
            title: {
                text: 'Multas de Tráfico por Ciudad y Tipo (Columna Apilada)',
                align: 'center'
            },
            dataLabels: {
                enabled: false
            },
            xaxis: {
                categories: cities,
                title: { text: 'Ciudad' },
                labels: { rotate: -45, style: { fontSize: '12px' } }
            },
            yaxis: {
                title: {
                    text: 'Número Total de Multas'
                },
                labels: {
                    formatter: function (value) {
                        return value ? value.toLocaleString() : '0';
                    }
                }
            },
            tooltip: {
                shared: true,
                intersect: false,
                y: {
                    formatter: function (y) {
                        if (typeof y !== "undefined") {
                            return y.toLocaleString();
                        }
                        return y;
                    }
                }
            },
            colors: ['#008FFB', '#FF4560', '#00E396'] // Colores para cada serie
        };

        if (chartContainer) {
            chartContainer.innerHTML = '';
            chartInstance = new ApexCharts(chartContainer, options);
            chartInstance.render();
        }
    }

    // Inicializar todo al montar el componente
    onMount(async () => {
        await fetchFinesData();
        if (finesData.length > 0) {
            initStackedColumnChart(); 
        }
    });
</script>

<svelte:head>
    <title>Uso API: Multas de Tráfico</title>
</svelte:head>

<main>
    <h2>Uso API: Multas de Tráfico</h2>

    <div class="explanation">
        <p>
            Este grafico de columna apilada muestra el total de multas por ciudad, con la contribución de cada tipo (ITV, Alcoholemia, Radar) apilada en la misma columna.
        </p>
    </div>

    <div class="chart-container" bind:this={chartContainer}>
        {#if !finesData.length}
            <div class="loading">Cargando datos de multas...</div>
        {/if}
        {#if finesData.length > 0 && processFinesData().cities.length === 0}
            <div class="error-message">No hay datos procesables para crear el gráfico. Revisa la estructura de los datos de la API.</div>
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
            <li>Multas de Tráfico: G20-FINES</li>
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
        border-left: 5px solid #008FFB;
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
        color: #008FFB;
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