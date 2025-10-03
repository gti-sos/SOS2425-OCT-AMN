<script>
    // @ts-nocheck
    import { onMount } from 'svelte';
    import * as Highcharts from 'highcharts'; // Highcharts sigue siendo necesario
    import * as echarts from 'echarts';       // ECharts también
    import { dev } from '$app/environment';

    const DEVEL_HOST = 'http://localhost:16078'; 
    const PRODUCTION_HOST = 'https://sos2425-OCT-AMN.onrender.com';
    const API_PATH = '/api/v1/forest-fires';

    let API = dev ? DEVEL_HOST + API_PATH : PRODUCTION_HOST + API_PATH;

    let fires = [];
    let areaChartContainer; // Contenedor para Highcharts Area Chart
    let treemapContainer;   // Contenedor para ECharts Treemap
    let areaChartInstance;  // Instancia de Highcharts
    let treemapInstance;    // Instancia de ECharts

    let isLoading = true;
    let errorMessage = '';

    const colorPalette = ['#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9', '#f15c80', '#e4d354'];

    /**
     * Obtiene los datos de incendios forestales de la API.
     */
    async function fetchData() {
        isLoading = true;
        errorMessage = '';
        try {
            const resp = await fetch(API);
            if (!resp.ok) {
                const errorText = await resp.text();
                throw new Error(`Error al cargar datos: ${resp.status} - ${errorText}`);
            }
            fires = await resp.json();
            console.log(`Cargados ${fires.length} registros de incendios forestales.`);
        } catch (error) {
            console.error('Error en fetchData:', error);
            errorMessage = `No se pudieron cargar los datos. Por favor, inténtelo de nuevo más tarde.`;
        } finally {
            isLoading = false;
        }
    }

    /**
     * Inicializa el gráfico de Área de Highcharts.
     * Muestra la evolución del número total de accidentes a lo largo de los años.
     */
    function initHighchartsAreaChart() {
        if (!areaChartContainer) {
            console.error('Contenedor Highcharts Area Chart no disponible.');
            return;
        }
        if (!fires || fires.length === 0) {
            console.warn('No hay datos disponibles para Highcharts Area Chart.');
            return;
        }

        // Agrupar datos por año para el gráfico de área
        const dataByYear = fires.reduce((acc, entry) => {
            if (!acc[entry.year]) {
                acc[entry.year] = { totalAccidents: 0, totalLargeFires: 0, count: 0 };
            }
            acc[entry.year].totalAccidents += entry.number_of_accidents;
            acc[entry.year].totalLargeFires += entry.percentage_of_large_fires;
            acc[entry.year].count++;
            return acc;
        }, {});

        const sortedYears = Object.keys(dataByYear).map(Number).sort((a, b) => a - b);

        const accidentsSeriesData = sortedYears.map(year => dataByYear[year].totalAccidents);
        const avgLargeFiresSeriesData = sortedYears.map(year => 
            Number(((dataByYear[year].totalLargeFires / dataByYear[year].count) * 100).toFixed(2))
        );

        areaChartInstance = Highcharts.chart(areaChartContainer, {
            chart: {
                type: 'area', // CAMBIADO a 'area'
                height: 500
            },
            title: {
                text: 'Evolución Anual de Incendios Forestales en España'
            },
            xAxis: {
                categories: sortedYears,
                title: {
                    text: 'Año'
                }
            },
            yAxis: [{ // Eje Y primario para accidentes
                title: {
                    text: 'Número Total de Accidentes'
                },
                min: 0
            }, { // Eje Y secundario para porcentaje de grandes incendios
                title: {
                    text: 'Porcentaje Promedio de Grandes Incendios (%)'
                },
                min: 0,
                max: 100,
                opposite: true // Coloca este eje a la derecha
            }],
            tooltip: {
                shared: true,
                formatter: function() {
                    let tooltip = `<b>Año: ${this.x}</b><br/>`;
                    this.points.forEach(point => {
                        tooltip += `<span style="color:${point.series.color}">${point.series.name}</span>: <b>${point.y} ${point.series.name.includes('Porcentaje') ? '%' : ''}</b><br/>`;
                    });
                    return tooltip;
                }
            },
            plotOptions: {
                area: {
                    marker: {
                        enabled: false,
                        symbol: 'circle',
                        radius: 2,
                        states: {
                            hover: {
                                enabled: true
                            }
                        }
                    }
                }
            },
            series: [{
                name: 'Total Accidentes',
                data: accidentsSeriesData,
                yAxis: 0, // Usa el primer eje Y
                color: colorPalette[0]
            }, {
                name: 'Porcentaje Grandes Incendios (Promedio)',
                data: avgLargeFiresSeriesData,
                yAxis: 1, // Usa el segundo eje Y
                color: colorPalette[3]
            }],
             credits: {
                enabled: false // Deshabilita la marca de agua de Highcharts
            }
        });
    }

    /**
     * Inicializa el gráfico de Treemap con ECharts.
     * Muestra la distribución de accidentes por comunidad y año.
     */
    function initEChartsTreemap() {
        if (!treemapContainer) {
            console.error('Contenedor para ECharts Treemap no disponible.');
            return;
        }
        if (!fires || fires.length === 0) {
            console.warn('No hay datos disponibles para ECharts Treemap.');
            return;
        }

        // Preparar datos para Treemap (jerárquicos)
        // Estructura: { name: 'Comunidad', value: total, children: [{ name: 'Año', value: accidentes }] }
        const treemapDataMap = fires.reduce((acc, entry) => {
            const community = entry.autonomous_community;
            const year = entry.year;
            const accidents = entry.number_of_accidents;

            if (!acc[community]) {
                acc[community] = {
                    name: community,
                    value: 0, // Suma total de accidentes para la comunidad
                    children: {} // Para los años dentro de la comunidad
                };
            }
            if (!acc[community].children[year]) {
                acc[community].children[year] = {
                    name: String(year), // El nombre debe ser string para ECharts
                    value: 0 // Suma de accidentes para ese año en esa comunidad
                };
            }
            acc[community].children[year].value += accidents;
            acc[community].value += accidents; // Suma al total de la comunidad

            return acc;
        }, {});

        // Convertir el mapa a un array de objetos para ECharts
        const treemapSeriesData = Object.values(treemapDataMap).map(communityData => ({
            name: communityData.name,
            value: communityData.value,
            children: Object.values(communityData.children)
        }));

        const option = {
            title: {
                text: 'Distribución de Accidentes por Comunidad y Año',
                subtext: 'Tamaño del área proporcional al número de accidentes',
                left: 'center'
            },
            tooltip: {
                formatter: function (info) {
                    const value = info.value;
                    const name = info.name;
                    // Si es un nodo de comunidad (no tiene padre o es el nivel superior)
                    if (info.treePathInfo.length === 2) { // 2 significa que es el nodo raíz (global) y luego el de la comunidad
                        return `<b>${name}</b><br/>Total Accidentes: ${value}`;
                    }
                    // Si es un nodo de año dentro de una comunidad
                    if (info.treePathInfo.length === 3) { // 3 significa raíz -> comunidad -> año
                         const communityName = info.treePathInfo[1].name;
                         return `<b>${communityName}</b><br/>Año: ${name}<br/>Accidentes: ${value}`;
                    }
                    return '';
                }
            },
            series: [
                {
                    type: 'treemap', // CAMBIADO a 'treemap'
                    data: treemapSeriesData,
                    leafDepth: 1, // Muestra al menos 1 nivel de hijos (años)
                    roam: 'zoom', // Permite zoom y paneo
                    nodeClick: 'zoomToNode', // Hace zoom al clickar un nodo
                    breadcrumb: {
                        show: true // Muestra la ruta de navegación
                    },
                    label: {
                        show: true,
                        formatter: '{b}' // Muestra el nombre del nodo
                    },
                    itemStyle: {
                        borderColor: '#fff'
                    },
                    levels: [
                        {
                            itemStyle: {
                                borderColor: '#777',
                                borderWidth: 0,
                                gapWidth: 1
                            },
                            upperLabel: {
                                show: false
                            }
                        },
                        {
                            itemStyle: {
                                borderColor: '#555',
                                borderWidth: 5,
                                gapWidth: 1
                            },
                            emphasis: {
                                itemStyle: {
                                    borderColor: '#ddd'
                                }
                            }
                        }
                    ]
                }
            ]
        };

        // Destruir la instancia existente si la hay para evitar duplicados
        if (treemapInstance) {
            treemapInstance.dispose();
        }
        treemapInstance = echarts.init(treemapContainer);
        treemapInstance.setOption(option);

        // Hace el gráfico responsivo
        window.addEventListener('resize', () => treemapInstance.resize());
    }


    // Se ejecuta cuando el componente se monta en el DOM
    onMount(async () => {
        await fetchData(); // Primero, carga los datos

        if (fires.length > 0) {
            requestAnimationFrame(() => {
                initHighchartsAreaChart();
                initEChartsTreemap();
            });
        }

        // Función de limpieza que se ejecuta cuando el componente se desmonta
        return () => {
            if (areaChartInstance) {
                areaChartInstance.destroy(); // Highcharts usa .destroy()
            }
            if (treemapInstance) {
                treemapInstance.dispose(); // ECharts usa .dispose()
            }
            // Eliminar listener para evitar fugas de memoria
            window.removeEventListener('resize', () => {
                if (areaChartInstance) areaChartInstance.reflow(); // Highcharts usa reflow para redibujar
                if (treemapInstance) treemapInstance.resize();
            });
        };
    });
</script>

<svelte:head>
    <title>Gráficas de Incendios Forestales</title>
    <meta name="description" content="Visualización de datos sobre los incendios forestales" />
</svelte:head>

<main>
    <h2>Visualización de los Incendios Forestales</h2>

    <div class="button-group">
        <a href="/integrations/forest-fires/G15-TEMPERATURE-STATS">
            <button>G15-TEMPERATURE-STATS</button>
        </a>
        <a href="/integrations/forest-fires/G20-FINES">
            <button>G20-FINES</button>
        </a>
        <a href="/integrations/forest-fires/G12-ANNUAL-EVOLUTIONS">
            <button>G12-ANNUAL-EVOLUTIONS</button>
        </a>
         <a href="/integrations/forest-fires/G21-PUBLIC-TRANSIT-STATS">
            <button>G21-PUBLIC-TRANSIT-STATS</button>
        </a>
        <a href="/integrations/forest-fires/COCKTAIL">
            <button>COCKTAIL</button>
        </a>
        <a href="/integrations/forest-fires/COVID-19">
            <button>COVID-19</button>
        </a>
        <a href="/integrations/forest-fires/COINGECKO">
            <button>COINGECKO</button>
        </a>
    </div>

    {#if isLoading}
        <div class="loading">Cargando gráficos...</div>
    {:else if errorMessage}
        <div class="error-message">{errorMessage}</div>
    {:else if fires.length === 0}
        <div class="no-data">No hay datos disponibles para mostrar los gráficos.</div>
    {:else}
        <div class="chart-container">
            <div bind:this={areaChartContainer} class="chart-box"></div>
        </div>

        <div class="chart-container">
            <div bind:this={treemapContainer} class="chart-box"></div>
        </div>
    {/if}
</main>

<style>
    main {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
        font-family: 'Arial', sans-serif;
    }

    h2 {
        text-align: center;
        margin: 2rem 0;
        color: #2c3e50;
        font-size: 2.2em;
        font-weight: 600;
    }

    .button-group {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 2rem;
    }
    .button-group button {
        padding: 0.75rem 1.5rem;
        font-size: 1.1rem;
        cursor: pointer;
        border: none;
        border-radius: 6px;
        background-color: #a8c686;
        color: #000;
        transition: background-color 0.3s ease, transform 0.2s ease;
    }
    .button-group button:hover {
        background-color: #9bb37c;
        transform: translateY(-2px);
    }
    .button-group button:active {
        background-color: #8da06b;
        transform: translateY(0);
    }

    .chart-container {
        margin: 2rem auto;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        background-color: white;
        padding: 1.5rem;
    }

    .chart-box {
        width: 100%;
        height: 500px; /* Altura fija para ambos gráficos */
        min-height: 400px; /* Altura mínima para una mejor maquetación */
    }

    .loading,
    .error-message,
    .no-data {
        text-align: center;
        font-size: 1.3rem;
        padding: 3rem;
        border-radius: 8px;
        margin: 2rem auto;
        max-width: 600px;
    }

    .loading {
        background-color: #e6f7ff;
        color: #0056b3;
        border: 1px solid #91d5ff;
    }

    .error-message {
        background-color: #fff0f0;
        color: #d8000c;
        border: 1px solid #ffb3b3;
    }

    .no-data {
        background-color: #fffae6;
        color: #cc8400;
        border: 1px solid #ffe799;
    }

    /* Ajustes responsivos */
    @media (max-width: 768px) {
        h2 {
            font-size: 1.8em;
        }
        .button-group {
            flex-direction: column;
            align-items: center;
        }
        .button-group button {
            width: 80%;
            max-width: 300px;
        }
        .chart-box {
            height: 400px;
            min-height: 300px;
        }
    }

    @media (max-width: 480px) {
        main {
            padding: 0 10px;
        }
        h2 {
            font-size: 1.5em;
        }
        .button-group button {
            font-size: 1rem;
            padding: 0.6rem 1rem;
        }
        .chart-container {
            padding: 1rem;
        }
        .chart-box {
            height: 350px;
        }
    }
</style>