<script>
    // @ts-check
    import { onMount } from 'svelte';
    import { dev } from '$app/environment';
    
    import Highcharts from 'highcharts';
    import 'highcharts/highcharts-more';
    
    // URL para la API de estadísticas de temperatura.
    const TEMPERATURE_STATS_API = dev
        ? 'http://localhost:16078/api/v1/proxy/temperature-stats'
        : 'https://sos2425-15.onrender.com/api/v1/proxy/temperature-stats';

    // Variables para almacenar los datos
    let temperatureData = [];
    let chartInstance;
    let chartContainer;

    /**
     * Función para obtener datos de la API de Temperaturas.
     */
    async function fetchTemperatureData() {
        try {
            const response = await fetch(TEMPERATURE_STATS_API);
            if (!response.ok) {
                // Si tienes un error 500, ¡la URL del proxy y el servidor deben estar revisados!
                throw new Error(`Error al obtener datos de temperaturas: ${response.status} - ${response.statusText}`);
            }
            temperatureData = await response.json();
            console.log('Datos de Temperaturas:', temperatureData);

        } catch (error) {
            console.error('Fallo al cargar los datos de temperaturas:', error);
            temperatureData = [];
        }
    }

    /**
     * Procesa los datos para el formato de Highcharts Area Range.
     * Agrupamos los datos por año y calculamos la temperatura mínima y máxima.
     * @returns {{years: number[], series: {name: string, data: number[][]}[]}}
     */
    function processTemperatureData() {
        if (!temperatureData || temperatureData.length === 0) {
            return { years: [], series: [] };
        }

        const dataByYear = {};
        temperatureData.forEach(item => {
            const year = item.year;
            if (!dataByYear[year]) {
                dataByYear[year] = { min: Infinity, max: -Infinity, values: [] };
            }
            const temp = item.average_temperature; 
            dataByYear[year].values.push(temp);
            dataByYear[year].min = Math.min(dataByYear[year].min, temp);
            dataByYear[year].max = Math.max(dataByYear[year].max, temp);
        });

        const years = Object.keys(dataByYear).sort((a, b) => Number(a) - Number(b));
        
        const areaRangeData = years.map(year => {
            const data = dataByYear[year];
            // Highcharts Area Range data format: [xValue, low, high]
            return [
                Number(year), // Usamos el año como valor X
                parseFloat(data.min.toFixed(2)),
                parseFloat(data.max.toFixed(2))
            ];
        });
        
        // Creamos la serie para el Area Range (rango min-max)
        const series = [
            {
                name: 'Rango de Temperatura (°C)',
                data: areaRangeData,
                type: 'arearange', 
                lineWidth: 0,
                color: Highcharts.getOptions().colors[0] || '#1E88E5', 
                fillOpacity: 0.3,
                zIndex: 0,
                marker: { enabled: false }
            }
        ];

        return { years, series };
    }

    /**
     * Inicializa y renderiza el gráfico de Rango de Área con Highcharts.
     */
    function initAreaRangeChart() {
        if (!temperatureData || temperatureData.length < 2) {
            console.error('No hay suficientes datos disponibles para el gráfico de Rango de Área.');
            return;
        }

        const { series } = processTemperatureData();

        if (series.length === 0 || series[0].data.length === 0) {
            if (chartContainer) {
                chartContainer.innerHTML = '<div class="error-message">No hay datos procesables para crear el gráfico.</div>';
            }
            return;
        }

        if (chartContainer) {
            chartContainer.innerHTML = '';
            
            // Usamos Highcharts.chart() para renderizar
            chartInstance = Highcharts.chart(chartContainer, {
                chart: {
                    type: 'arearange', 
                    height: 500,
                    zoomType: 'x'
                },
                title: {
                    text: 'Rango Anual de Temperatura Media por Provincia'
                },
                xAxis: {
                    title: { text: 'Año' },
                    type: 'category',
                    tickInterval: 1 
                },
                yAxis: {
                    title: { text: 'Temperatura (°C)' }
                },
                tooltip: {
                    shared: true,
                    valueSuffix: ' °C',
                    pointFormat: '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.low:.2f}</b> a <b>{point.high:.2f}</b><br/>'
                },
                plotOptions: {
                    series: {
                        fillOpacity: 0.2
                    }
                },
                series: series
            });
        }
    }

    // Inicializar todo al montar el componente
    onMount(async () => {
        await fetchTemperatureData();
        if (temperatureData.length > 1) {
            initAreaRangeChart();
        }
        
        // Limpiar al destruir el componente
        return () => {
            if (chartInstance) {
                chartInstance.destroy();
            }
        };
    });
</script>

<svelte:head>
    <title>Uso API: Temperaturas</title>
</svelte:head>

<main>
    <h2>Uso API: Temperaturas</h2>

    <div class="explanation">
        <p>
            Este gráfico de Area Range muestra el rango entre la temperatura media más baja y la más alta registradas en todas las provincias para un año dado, asegurando que la combinación sea única.
        </p>
    </div>

    <div class="chart-container" bind:this={chartContainer}>
        {#if !temperatureData.length}
            <div class="loading">Cargando datos de temperaturas...</div>
        {/if}
        {#if temperatureData.length > 0 && processTemperatureData().years.length === 0}
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
            <li>Estadísticas de Temperatura: G15-TEMPERATURE-STATS</li>
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
        border-left: 5px solid #1E88E5; 
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
        color: #1E88E5; 
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