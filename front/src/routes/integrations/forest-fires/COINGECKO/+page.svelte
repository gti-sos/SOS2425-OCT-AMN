<script>
    // @ts-check
    import { onMount } from 'svelte';
    import ApexCharts from 'apexcharts';
    import { dev } from '$app/environment';

    const BTC_API = dev
        ? 'http://localhost:16078/api/proxy/bitcoin-stats'
        : 'https://sos2425-OCT-AMN.onrender.com/api/proxy/bitcoin-stats'; 

    let bitcoinData = [];
    let chartInstance;
    let chartContainer;

    /**
     * Función para obtener datos históricos de Bitcoin.
     */
    async function fetchBitcoinData() {
        try {
            // Se añaden los parámetros de la URL para obtener los datos de los últimos 7 días

            const response = await fetch(BTC_API + '?vs_currency=usd&days=7');
            if (!response.ok) {
                throw new Error(`Error al obtener datos de Bitcoin: ${response.status} - ${response.statusText}`);
            }
            bitcoinData = await response.json();
            console.log('Datos de Bitcoin:', bitcoinData);

        } catch (error) {
            console.error('Fallo al cargar los datos de Bitcoin:', error);
            bitcoinData = []; // Asegura que los datos estén vacíos en caso de error
        }
    }

    /**
     * Procesa los datos de la API para el formato del gráfico.
     */
    function processBitcoinData() {
        if (!bitcoinData || !bitcoinData.prices || bitcoinData.prices.length === 0) {
            return { dates: [], series: [] };
        }

        const prices = bitcoinData.prices.map(item => item[1]);
        const dates = bitcoinData.prices.map(item => {
            const date = new Date(item[0]);
            return `${date.getDate()}/${date.getMonth() + 1}`;
        });

        const series = [{
            name: 'Precio de Bitcoin',
            data: prices
        }];

        return { dates, series };
    }

    /**
     * Inicializa y renderiza el gráfico de líneas.
     */
    function initAreaChart() {
        const { dates, series } = processBitcoinData();

        if (dates.length === 0 || series.length === 0) {
            if (chartContainer) {
                chartContainer.innerHTML = '<div class="error-message">No hay datos suficientes para crear el gráfico de Bitcoin.</div>';
            }
            return;
        }

        const options = {
            series: series,
            chart: {
                type: 'area',
                height: 500,
                toolbar: { show: true },
                zoom: { enabled: true }
            },
            title: {
                text: 'Evolución del Precio de Bitcoin (Últimos 7 Días)',
                align: 'center'
            },
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth' },
            xaxis: {
                categories: dates,
                title: { text: 'Fecha' },
                type: 'category'
            },
            yaxis: {
                title: { text: 'Precio (USD)' },
                labels: {
                    formatter: function (value) {
                        return `$${value.toLocaleString()}`;
                    }
                }
            },
            tooltip: {
                shared: true,
                intersect: false,
                y: {
                    formatter: function (y) {
                        if (typeof y !== "undefined") {
                            return `$${y.toLocaleString()}`;
                        }
                        return y;
                    }
                }
            },
            colors: ['#f7931a']
        };

        if (chartContainer) {
            chartContainer.innerHTML = '';
            chartInstance = new ApexCharts(chartContainer, options);
            chartInstance.render();
        }
    }

    // Inicializar al montar el componente
    onMount(async () => {
        await fetchBitcoinData();
        if (bitcoinData && bitcoinData.prices && bitcoinData.prices.length > 0) {
            initAreaChart();
        }
    });
</script>

<svelte:head>
    <title>Uso API: Precio de Bitcoin</title>
</svelte:head>

<main>
    <h2>Uso API: Precio de Bitcoin</h2>

    <div class="explanation">
        <p>
            Este gráfico de área muestra la evolución del precio de Bitcoin a lo largo del tiempo,
            utilizando datos de la API de Coingecko.
        </p>
    </div>

    <div class="chart-container" bind:this={chartContainer}>
        {#if !bitcoinData || (bitcoinData.prices && bitcoinData.prices.length === 0)}
            <div class="loading">Cargando datos de Bitcoin...</div>
        {/if}
        {#if bitcoinData && bitcoinData.prices && bitcoinData.prices.length > 0 && processBitcoinData().dates.length === 0}
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
            <li>Precio de Bitcoin: Coingecko API</li>
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
        border-left: 5px solid #f7931a;
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
        color: #f7931a;
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