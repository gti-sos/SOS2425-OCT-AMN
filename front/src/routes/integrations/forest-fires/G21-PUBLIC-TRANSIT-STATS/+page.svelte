<script>
    // @ts-check
    import { onMount } from 'svelte';
    import * as echarts from 'echarts'; 
    import { dev } from '$app/environment';

    // URL para la API de estadísticas de transporte público.
    const TRANSIT_API = dev
        ? 'http://localhost:16078/api/v1/proxy/public-transit-stats' 
        : 'https://sos2425-AGB.onrender.com/api/v1/proxy/public-transit-stats';

    let transitData = [];
    let dataLoaded = false;
    let chartContainer; 
    let chartInstance;

    /**
     * Función para obtener datos de la API de Transporte Público.
     */
    async function fetchTransitData() {
        try {
            const response = await fetch(TRANSIT_API);
            if (!response.ok) {
                throw new Error(`Error al obtener datos de transporte: ${response.status} - ${response.statusText}`);
            }
            transitData = await response.json();
            dataLoaded = true;

        } catch (error) {
            console.error('Fallo al cargar los datos de transporte:', error);
            transitData = []; 
            dataLoaded = true;
        }
    }

    /**
     * Procesa los datos para el gráfico de Líneas Suaves por Etapas.
     * La estructura de datos es la misma que para el gráfico de líneas.
     * @returns {{years: string[], provinces: string[], series: object[]}}
     */
    function processTransitDataForStepLine() {
        if (!transitData || transitData.length === 0) {
            return { years: [], provinces: [], series: [] };
        }

        // Obtener la lista única y ordenada de años y provincias
        const years = [...new Set(transitData.map(item => String(item.year)))].sort();
        const provinces = [...new Set(transitData.map(item => item.province))].sort();

        const series = provinces.map(province => {
            return {
                name: province,
                type: 'line',
                smooth: true, // Línea suave
                step: 'middle', // ⬅️ Crucial: el estilo de paso para hacerlo único
                emphasis: { focus: 'series' },
                data: years.map(year => {
                    const dataPoint = transitData.find(item => item.province === province && String(item.year) === year);
                    return dataPoint ? dataPoint.total_trips : 0;
                })
            };
        });

        return { years, provinces, series };
    }

    /**
     * Inicializa y renderiza el gráfico de Líneas Suaves por Etapas usando ECharts.
     */
    function initStepLineChart() {
        const { years, provinces, series } = processTransitDataForStepLine();

        if (years.length === 0 || provinces.length === 0) {
            if (chartContainer) {
                chartContainer.innerHTML = '<div class="error-message">No hay datos suficientes para crear el gráfico.</div>';
            }
            return;
        }

        if (chartContainer) {
            if (chartInstance) {
                chartInstance.dispose();
            }
            
            chartInstance = echarts.init(chartContainer);

            // Configuración del gráfico
            const option = {
                title: {
                    text: 'Evolución Anual de Viajes por Provincia',
                    left: 'center',
                    textStyle: { color: '#2c3e50' }
                },
                tooltip: {
                    trigger: 'axis',
                    formatter: function(params) {
                         let result = params[0].name + '<br/>';
                         params.forEach(function (item) {
                            if (item.data) {
                                const valueM = (item.data / 1000000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'M';
                                result += '<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:' + item.color + ';"></span>' + 
                                          item.seriesName + ': ' + valueM + '<br/>';
                            }
                         });
                         return result;
                    }
                },
                legend: {
                    data: provinces,
                    bottom: 0,
                    type: 'scroll' // Para manejar muchas provincias
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '10%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: years,
                    name: 'Año'
                },
                yAxis: {
                    type: 'value',
                    name: 'Total de Viajes (millones)',
                    axisLabel: {
                        formatter: function (value) {
                            return (value / 1000000).toLocaleString() + 'M';
                        }
                    }
                },
                series: series,
              
                color: ['#5470C6', '#91CC75', '#EE6666', '#73C0DE', '#3BA272', '#FC8452', '#9A60B4']
            };

            chartInstance.setOption(option);
            
            window.addEventListener('resize', chartInstance.resize);
        }
    }

    // Inicializar todo al montar el componente
    onMount(async () => {
        await fetchTransitData();
        if (transitData.length > 0) {
            initStepLineChart();
        }
        
        // Limpieza al destruir
        return () => {
            if (chartInstance) {
                window.removeEventListener('resize', chartInstance.resize);
                chartInstance.dispose();
            }
        };
    });
</script>

<svelte:head>
    <title>Uso API: Transporte Público</title>
</svelte:head>

<main>
    <h2>Uso API: Transporte Público</h2>
    
    <div class="explanation">
        <p>
            Este gráfico de linea por etapas muestra la evolución de los viajes anuales por provincia sin usar curvas o líneas rectas simples.
        </p>
    </div>

    <div class="chart-container" bind:this={chartContainer}>
        {#if !dataLoaded}
            <div class="loading">Cargando datos de transporte público...</div>
        {:else if transitData.length === 0}
            <div class="error-message">Error: No se pudieron cargar datos de la API.</div>
        {:else if processTransitDataForStepLine().years.length === 0}
            <div class="error-message">No hay datos procesables para crear el gráfico. Revisa la estructura.</div>
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
            <li>Estadísticas de Transporte Público: G21-PUBLIC-TRANSIT-STATS</li>
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
        border-left: 5px solid #5470C6; 
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
    /* Asegura que ECharts tenga espacio */
    .chart-container > div {
        height: 100%;
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
        color: #5470C6; 
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