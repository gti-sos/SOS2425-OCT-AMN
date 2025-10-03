<script>
    // @ts-check
    import { onMount } from 'svelte';
    import ApexCharts from 'apexcharts';
    import { dev } from '$app/environment';

    // URL para la nueva API de evoluciones anuales.
    const CRR_API = dev
        ? 'http://localhost:16078/api/v1/proxy/annual-evolutions' // Asegúrate que el proxy apunte a la API del otro grupo
        : 'https://sos2425-crr.onrender.com/api/v1/proxy/annual-evolutions'; // URL de ejemplo en Render

    let annualData = [];
    let chartInstance;
    let chartContainer;

    async function fetchAnnualData() {
        try {
            const response = await fetch(CRR_API);
            if (!response.ok) {
                throw new Error(`Error al obtener datos anuales: ${response.status} - ${response.statusText}`);
            }
            annualData = await response.json();
        } catch (error) {
            console.error('Fallo al cargar los datos de evoluciones:', error);
            annualData = [];
        }
    }

    /**
     * Procesa los datos para el formato del gráfico Candlestick (OHLC)
     * Calculamos por cada año:
     * - Open: Energía media total del año anterior (simulación de apertura)
     * - High/Low: Máximo/Mínimo de Energía Vendida entre las CCAA ese año
     * - Close: Energía media total de ese año
     * @returns {{years: number[], series: {name: string, data: [number, number[]][]}[]}}
     */
    function processAnnualData() {
        if (!annualData || annualData.length === 0) {
            return { years: [], series: [] };
        }

        const years = [...new Set(annualData.map(item => item.year))].sort((a, b) => a - b);
        const dataByYear = {};

        // 1. Agrupar y Calcular Metadatos por Año
        annualData.forEach(item => {
            if (!dataByYear[item.year]) {
                dataByYear[item.year] = { values: [], total: 0, count: 0 };
            }
            dataByYear[item.year].values.push(item.energy_sold);
            dataByYear[item.year].total += item.energy_sold;
            dataByYear[item.year].count++;
        });

        const seriesData = [];
        let previousAverage = null;

        // 2. Calcular los valores OHLC (Open, High, Low, Close)
        years.forEach((year, index) => {
            const currentData = dataByYear[year];
            const currentAverage = currentData.total / currentData.count;
            const open = previousAverage || currentAverage; // Abre con la media anterior o la actual
            const close = currentAverage;
            const high = Math.max(...currentData.values);
            const low = Math.min(...currentData.values);

            // [Timestamp, [Open, High, Low, Close]]
            seriesData.push([
                year,
                [open, high, low, close].map(val => parseFloat(val.toFixed(2))) // Formatear a 2 decimales
            ]);

            previousAverage = currentAverage;
        });
        
        // El Candlestick de ApexCharts requiere un formato de serie simple
        const series = [{
            name: 'Energía Vendida (OHLC)',
            data: seriesData
        }];

        return { years, series };
    }

    /**
     * Inicializa y renderiza el gráfico de Candlestick.
     */
    function initCandlestickChart() {
        if (!annualData || annualData.length < 2) {
            console.error('No hay suficientes datos para el gráfico de Candlestick (requiere al menos 2 puntos).');
            return;
        }

        const { series } = processAnnualData();

        if (series.length === 0 || series[0].data.length === 0) {
            if (chartContainer) {
                chartContainer.innerHTML = '<div class="error-message">No hay datos procesables para crear el gráfico de Candlestick.</div>';
            }
            return;
        }

        // Configuración del gráfico de Candlestick
        const options = {
            series: series,
            chart: {
                type: 'candlestick', 
                height: 500,
                toolbar: { show: true },
                zoom: { enabled: true }
            },
            title: {
                text: 'Evolución Anual de Energía',
                align: 'center'
            },
            xaxis: {
                // El eje X de Candlestick usa el primer valor del array de datos (el año)
                type: 'category', 
                labels: {
                    formatter: function(val) {
                        return val; // Mostrar el año como etiqueta
                    }
                }
            },
            yaxis: {
                title: {
                    text: 'Energía Vendida (kWh)'
                },
                tooltip: {
                    enabled: true
                }
            }
        };

        if (chartContainer) {
            chartContainer.innerHTML = '';
            chartInstance = new ApexCharts(chartContainer, options);
            chartInstance.render();
        }
    }

    // Inicializar todo al montar el componente
    onMount(async () => {
        await fetchAnnualData();
        if (annualData.length > 1) {
            initCandlestickChart();
        }
    });
</script>

<svelte:head>
    <title>Uso API: Evoluciones Anuales</title>
</svelte:head>

<main>
    <h2>Uso API: Evoluciones Anuales</h2>

    <div class="explanation">
        <p>
            Este grafico de Candlestick muestra el rango de energía vendida anualmente, donde el cuerpo de la vela representa la media de energía (Apertura/Cierre) y las mechas representan el máximo y mínimo de energía vendida entre las CCAA ese año.
        </p>
    </div>

    <div class="chart-container" bind:this={chartContainer}>
        {#if !annualData.length}
            <div class="loading">Cargando datos de evoluciones anuales...</div>
        {/if}
        {#if annualData.length > 0 && processAnnualData().series[0].data.length === 0}
            <div class="error-message">No hay datos procesables para crear el gráfico. Revisa la estructura de los datos de la API.</div>
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
            <li>Estadísticas de Evoluciones Anuales: G12-ANNUAL-EVOLUTIONS</li>
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