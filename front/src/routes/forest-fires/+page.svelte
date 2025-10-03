<script lang="ts">
  //@ts-nocheck
  //@ts-ignore
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    Button,
    Table,
    Alert,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter
  } from '@sveltestrap/sveltestrap';

  // Define la interfaz para un objeto Incendio
  interface Incendio {
    year: number;
    autonomous_community: string;
    number_of_accidents: number;
    percentage_of_large_fires: number;
  }

  // Importa la variable 'dev' para verificar el entorno (desarrollo/producción)
  import { dev } from '$app/environment';
  const BASE_URL = dev ? 'http://localhost:16078' : 'https://sos2425-OCT-AMN.onrender.com';
  const API = `${BASE_URL}/api/v1/forest-fires`;

  // Variables de estado para los datos y la UI
  let incendios: Incendio[] = [];
  let mensaje = ''; // Mensajes de éxito
  let error = ''; // Mensajes de error
  let filtroDesde: string = ''; // Filtro por año 'desde'
  let filtroHasta: string = ''; // Filtro por año 'hasta'
  let filtroComunidad: string = ''; // Filtro por comunidad autónoma

  // Variables para el formulario de añadir nuevo incendio
  let year = '';
  let autonomous_community = '';
  let number_of_accidents = '';
  let percentage_of_large_fires = '';

  // Variables para el modal de confirmación personalizado
  let showConfirmModal = false;
  let modalTitle = '';
  let modalBody = '';
  let confirmAction: () => Promise<void>; // Función a ejecutar si se confirma

  /**
   * Muestra un modal de confirmación personalizado.
   * @param {string} title - Título del modal.
   * @param {string} body - Contenido del mensaje del modal.
   * @param {Function} action - Función asíncrona a ejecutar si el usuario confirma.
   */
  function showConfirmation(title: string, body: string, action: () => Promise<void>) {
    modalTitle = title;
    modalBody = body;
    confirmAction = action;
    showConfirmModal = true;
  }

  /**
   * Maneja la acción de confirmación del modal.
   * Ejecuta la función 'confirmAction' y cierra el modal.
   */
  async function handleConfirm() {
    showConfirmModal = false;
    await confirmAction();
  }

  /**
   * Maneja la acción de cancelación del modal.
   * Simplemente cierra el modal.
   */
  function handleCancel() {
    showConfirmModal = false;
  }

  /**
   * Carga todos los registros de incendios forestales desde la API.
   * Si no hay datos (status 404), inicializa el array de incendios como vacío.
   */
  const cargarIncendios = async () => {
    try {
      const res = await fetch(API);
      if (res.status === 404) {
        incendios = [];
        mensaje = '';
        error = '';
        return;
      }
      if (!res.ok) throw new Error('Error cargando datos');
      incendios = await res.json();
      mensaje = '';
      error = '';
    } catch (err) {
      error = '❌ No se pudieron cargar los datos de incendios forestales. Asegúrate de que el backend esté corriendo.';
      mensaje = '';
      console.error(err);
    }
  };

  /**
   * Carga un conjunto de datos iniciales en la base de datos a través de la API.
   */
  const cargarDatosIniciales = async () => {
    try {
      const res = await fetch(`${API}/loadInitialData`);
      const data = await res.json();

      if (res.ok) {
        mensaje = '✅ Datos iniciales cargados correctamente.';
        error = '';
        await cargarIncendios(); // Recargar la lista después de cargar los datos
      } else {
        error = data.message || '❌ No se pudieron cargar los datos iniciales.';
        mensaje = '';
      }
    } catch (err) {
      console.error(err);
      error = '❌ Error de conexión con el servidor al cargar datos iniciales.';
      mensaje = '';
    }
  };

  /**
   * Crea un nuevo registro de incendio forestal enviando los datos del formulario a la API.
   * Realiza validaciones básicas antes de enviar.
   */
  const crearIncendio = async () => {
    mensaje = '';
    error = '';

    // Validación de campos obligatorios
    if (!year || !autonomous_community || !number_of_accidents || !percentage_of_large_fires) {
      error = '⚠️ Todos los campos son obligatorios.';
      return;
    }

    // Validación del rango del porcentaje
    const porcentaje = Number(percentage_of_large_fires);
    if (porcentaje < 0 || porcentaje > 1) {
      error = '⚠️ El porcentaje debe estar entre 0 y 1.';
      return;
    }

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: parseInt(year),
          autonomous_community: autonomous_community.trim().toLowerCase(),
          number_of_accidents: parseInt(number_of_accidents),
          percentage_of_large_fires: parseFloat(percentage_of_large_fires)
        })
      });

      const data = await res.json();

      if (res.status === 201) {
        mensaje = '✅ Recurso creado correctamente.';
        error = '';
        await cargarIncendios(); // Recargar la lista para mostrar el nuevo dato

        // Limpiar los campos del formulario
        year = '';
        autonomous_community = '';
        number_of_accidents = '';
        percentage_of_large_fires = '';
      } else if (res.status === 409) {
        error = '❌ Ya existe un incendio registrado con esos datos (año y comunidad).';
      } else if (res.status === 400) {
        error = data.error || '❌ Por favor, completa todos los campos obligatorios correctamente.';
      } else {
        error = '❌ No se pudo crear el recurso. Inténtalo más tarde.';
      }
    } catch (err) {
      console.error(err);
      error = '❌ Error de conexión con el servidor al crear el recurso.';
    }
  };

  /**
   * Busca incendios forestales aplicando los filtros de año y comunidad autónoma.
   */
  const buscar = async () => {
    let query = [];

    // Construye los parámetros de la URL para la búsqueda
    if (filtroDesde) query.push(`from=${filtroDesde}`);
    if (filtroHasta) query.push(`to=${filtroHasta}`);
    if (filtroComunidad) query.push(`autonomous_community=${filtroComunidad.trim().toLowerCase()}`);

    const url = `${API}${query.length ? '?' + query.join('&') : ''}`;
    console.log("URL de búsqueda:", url);

    try {
      const res = await fetch(url);
      const data = await res.json();
      console.log("Respuesta del servidor:", data);

      if (res.ok) {
        incendios = data;
        mensaje = `🔍 Se encontraron ${data.length} resultado(s).`;
        error = '';
      } else {
        incendios = []; // Vacía la tabla si no hay resultados o hay un error
        mensaje = '';
        error = (data as any).message || '❌ No se encontraron resultados que coincidan con los filtros.';
      }
    } catch (err) {
      console.error("Error completo:", err);
      error = '❌ Error al buscar datos. Verifica tu conexión o el formato de los filtros.';
      mensaje = '';
    }
  };

  /**
   * Limpia todos los filtros de búsqueda y recarga la lista completa de incendios.
   */
  const limpiarFiltros = async () => {
    filtroDesde = '';
    filtroHasta = '';
    filtroComunidad = '';
    await cargarIncendios();
  };

  /**
   * Elimina un registro de incendio específico.
   * Utiliza el modal de confirmación personalizado.
   * @param {number} year - Año del incendio a eliminar.
   * @param {string} autonomous_community - Comunidad autónoma del incendio a eliminar.
   */
  const borrarIncendio = async (year: number, autonomous_community: string) => {
    showConfirmation(
      'Confirmar Eliminación',
      `¿Seguro que deseas eliminar el registro de "${autonomous_community}" en ${year}?`,
      async () => {
        try {
          const res = await fetch(`${API}/${year}/${encodeURIComponent(autonomous_community)}`, {
            method: 'DELETE'
          });
          const data = await res.json();
          if (res.ok) {
            mensaje = `✅ ${data.message}`;
            error = '';
            await cargarIncendios(); // Recargar la lista después de eliminar
          } else {
            error = data.message || '❌ Error al eliminar el dato.';
            mensaje = '';
          }
        } catch (err) {
          error = '❌ Error inesperado al eliminar el dato.';
          mensaje = '';
        }
      }
    );
  };

  /**
   * Elimina todos los registros de incendios.
   * Utiliza el modal de confirmación personalizado.
   */
  const borrarTodos = async () => {
    showConfirmation(
      'Confirmar Eliminación Masiva',
      '⚠️ ¿Estás seguro de que deseas eliminar TODOS los registros? Esta acción es irreversible.',
      async () => {
        try {
          const res = await fetch(API, { method: 'DELETE' });
          const data = await res.json();
          if (res.ok) {
            mensaje = `✅ ${data.message}`;
            error = '';
            await cargarIncendios(); // Recargar la lista después de eliminar
          } else {
            error = data.message || '❌ Error al eliminar todos los datos.';
            mensaje = '';
          }
        } catch (err) {
          error = '❌ Error inesperado al eliminar todos los datos.';
          mensaje = '';
        }
      }
    );
  };

  /**
   * Navega a la página de edición para un registro de incendio específico.
   * @param {number} year - Año del incendio a editar.
   * @param {string} autonomous_community - Comunidad autónoma del incendio a editar.
   */
  const editar = (year: number, autonomous_community: string) => {
    goto(`/forest-fires/${year}/${encodeURIComponent(autonomous_community)}`);
  };

  // Hook de ciclo de vida: carga los incendios al montar el componente
  onMount(cargarIncendios);
</script>

<svelte:head>
  <title>Gestión de Incendios Forestales</title>
  <!-- Enlaza Google Fonts para Inter -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</svelte:head>

<!-- Contenedor principal con fondo suave y esquinas redondeadas -->
<div class="page-container">
  <main class="main-content-card">
    <h1 class="main-title">
      Gestión de Incendios Forestales
    </h1>

    <!-- Mensajes de Alerta (éxito/error) -->
    {#if mensaje}
      <Alert color="success" class="alert-message success">
        <span class="font-semibold">{mensaje}</span>
      </Alert>
    {/if}
    {#if error}
      <Alert color="danger" class="alert-message error">
        <span class="font-semibold">{error}</span>
      </Alert>
    {/if}

    <!-- Barra de botones de acciones principales -->
    <div class="main-buttons-bar">
      <!-- Botón "Borrar todo" -->
      <Button on:click={borrarTodos} class="main-button main-button-red">
        <span class="icon">❌</span> Borrar todo
      </Button>

      <!-- Botón "Cargar datos iniciales" -->
      <Button on:click={cargarDatosIniciales} class="main-button main-button-gray">
        <span class="icon">📋</span> Cargar datos iniciales
      </Button>

      <!-- Botón "Crear recurso" (para añadir) -->
      <Button on:click={crearIncendio} class="main-button main-button-green">
        <span class="icon">➕</span> Crear recurso
      </Button>

      <!-- Botón "Filtrar incendios" (para limpiar filtros) -->
      <Button on:click={buscar} class="main-button main-button-cyan">
        <span class="icon">🔍</span> Filtrar incendios
      </Button>
    </div>

    <!-- Sección de Añadir/Crear Recurso -->
    <section class="section-card section-add">
      <h2 class="section-title">Añadir nuevo incendio forestal</h2>
      <form on:submit|preventDefault={crearIncendio} class="form-grid">
        <input
          class="form-input"
          placeholder="Año"
          type="number"
          bind:value={year}
          required
        />
        <input
          class="form-input"
          placeholder="Comunidad Autónoma"
          type="text"
          bind:value={autonomous_community}
          required
        />
        <input
          class="form-input"
          placeholder="Accidentes"
          type="number"
          min="0"
          bind:value={number_of_accidents}
          required
        />
        <input
          class="form-input"
          placeholder="% Grandes Incendios (0-1)"
          type="number"
          step="0.01"
          min="0"
          max="1"
          title="⚠️ El porcentaje debe estar entre 0 y 1."
          bind:value={percentage_of_large_fires}
          required
        />
      </form>
    </section>

    <!-- Sección de Buscar/Filtrar -->
    <section class="section-card section-search">
      <h2 class="section-title">Buscar incendios</h2>
      <form on:submit|preventDefault={buscar} class="form-grid-search">
        <input
          class="form-input"
          placeholder="Desde año"
          type="number"
          bind:value={filtroDesde}
        />
        <input
          class="form-input"
          placeholder="Hasta año"
          type="number"
          bind:value={filtroHasta}
        />
        <input
          class="form-input"
          placeholder="Comunidad Autónoma"
          type="text"
          bind:value={filtroComunidad}
        />
      </form>
    </section>

    <!-- Sección de la Tabla de Incendios -->
    <section class="section-table">
      {#if incendios.length === 0}
        <p class="no-data-message">
          No hay datos disponibles. Carga los datos iniciales o añade nuevos registros.
        </p>
      {:else}
        <div class="table-container">
          <Table bordered hover class="data-table">
            <caption class="table-caption">Lista de incendios forestales</caption>
            <thead>
              <tr>
                <th class="table-header">Año</th>
                <th class="table-header">Comunidad Autónoma</th>
                <th class="table-header">Accidentes</th>
                <th class="table-header">% Grandes Incendios</th>
                <th class="table-header">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {#each incendios as i}
                <tr>
                  <td class="table-cell">{i.year}</td>
                  <td class="table-cell capitalize">{i.autonomous_community}</td>
                  <td class="table-cell">{i.number_of_accidents}</td>
                  <td class="table-cell">{(Number(i.percentage_of_large_fires) * 100).toFixed(1)}%</td>
                  <td class="table-cell actions-cell">
                    <Button on:click={() => editar(i.year, i.autonomous_community)} class="table-button table-button-edit">
                      ✏️ Editar
                    </Button>
                    <Button on:click={() => borrarIncendio(i.year, i.autonomous_community)} class="table-button table-button-delete">
                      🗑️ Eliminar
                    </Button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </Table>
        </div>
      {/if}
    </section>
  </main>
</div>

<!-- Custom Confirmation Modal -->
<Modal isOpen={showConfirmModal} toggle={handleCancel} backdrop="static" keyboard={false}>
  <ModalHeader toggle={handleCancel} class="modal-header-custom">
    <h5 class="modal-title-custom">{modalTitle}</h5>
  </ModalHeader>
  <ModalBody class="modal-body-custom">
    {modalBody}
  </ModalBody>
  <ModalFooter class="modal-footer-custom">
    <Button color="secondary" on:click={handleCancel} class="modal-button-cancel">
      Cancelar
    </Button>
    <Button color="primary" on:click={handleConfirm} class="modal-button-confirm">
      Confirmar
    </Button>
  </ModalFooter>
</Modal>

<style>
  /* Globales y Resets */
  :global(body) {
    font-family: 'Inter', sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f0f2f5; /* Fondo general más claro y suave */
  }

  /* Contenedor de la página */
  .page-container {
    min-height: 100vh;
    padding: 2rem 1rem; /* Aumentar padding para más espacio */
    display: flex;
    justify-content: center;
    align-items: flex-start; /* Alinear al inicio para que el contenido no esté pegado al centro vertical */
  }

  /* Contenido principal (la tarjeta grande) */
  .main-content-card {
    max-width: 1200px; /* Aumentar el ancho máximo */
    width: 100%;
    background-color: #ffffff;
    border-radius: 12px; /* Más redondeado */
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); /* Sombra más pronunciada y suave */
    padding: 2.5rem; /* Más padding interno */
  }

  /* Título principal */
  .main-title {
    font-size: 2rem; /* text-3xl -> text-2xl */ /* CAMBIO AQUÍ */
    font-weight: 800; /* font-extrabold */
    text-align: center;
    margin-bottom: 2.5rem; /* Más espacio debajo del título principal */
    color: #333333; /* Gris oscuro para el título */
  }

  /* Mensajes de alerta */
  .alert-message {
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
    margin-bottom: 1.5rem;
    border-left: 5px solid;
    font-size: 1rem;
  }
  .alert-message.success {
    background-color: #e6ffed;
    color: #28a745;
    border-color: #28a745;
  }
  .alert-message.error {
    background-color: #ffe6e6;
    color: #dc3545;
    border-color: #dc3545;
  }

  /* Barra de botones principales */
  .main-buttons-bar {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem; /* Espacio entre botones */
    margin-bottom: 2.5rem; /* Más espacio debajo de la barra de botones */
    padding: 1rem;
    background-color: #f8f9fa; /* Fondo suave para la barra */
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  /* Estilos base para todos los botones principales */
  .main-button {
    padding: 0.75rem 1.5rem; /* Más padding */
    border-radius: 8px; /* Esquinas más suaves */
    font-weight: 600; /* font-semibold */
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); /* Sombra más pronunciada */
    transition: all 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem; /* Espacio entre icono y texto */
    letter-spacing: 0.025em; /* tracking-wide */
    font-size: 1rem; /* Tamaño de fuente */
    border: none; /* Sin borde por defecto */
    cursor: pointer;
  }
  .main-button:hover {
    transform: translateY(-2px); /* Efecto de elevación */
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
  }
  .main-button .icon {
    font-size: 1.25rem; /* Tamaño del icono */
  }

  /* Colores específicos para los botones principales */
  .main-button-red {
    background-color: #dc3545; /* Rojo de Bootstrap danger */
    color: white;
  }
  .main-button-red:hover {
    background-color: #c82333;
  }
  .main-button-gray {
    background-color: #6c757d; /* Gris de Bootstrap secondary */
    color: white;
  }
  .main-button-gray:hover {
    background-color: #5a6268;
  }
  .main-button-green {
    background-color: #28a745; /* Verde de Bootstrap success */
    color: white;
  }
  .main-button-green:hover {
    background-color: #218838;
  }
  .main-button-yellow {
    background-color: #ffc107; /* Amarillo de Bootstrap warning */
    color: #333; /* Texto oscuro para contraste */
  }
  .main-button-yellow:hover {
    background-color: #e0a800;
  }
  .main-button-cyan {
    background-color: #17a2b8; /* Cyan de Bootstrap info */
    color: white;
  }
  .main-button-cyan:hover {
    background-color: #138496;
  }

  /* Estilos para las secciones de formulario */
  .section-card {
    padding: 2rem; /* Más padding */
    background-color: #fdfdfd; /* Blanco casi puro */
    border-radius: 10px; /* Redondeado suave */
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); /* Sombra suave */
    border-bottom: 2px solid #e9ecef; /* Borde inferior sutil */
  }
  .section-add {
    margin-bottom: 3.5rem; /* Aumentado el espacio debajo de la sección "Añadir" */ /* CAMBIO AQUÍ */
  }
  .section-search {
    margin-bottom: 2rem; /* Espacio para la sección "Buscar" */
  }

  .section-title {
    font-size: 1.25rem; /* text-xl -> text-lg */ /* CAMBIO AQUÍ */
    font-weight: 700; /* font-bold */
    color: #495057; /* Gris oscuro */
    margin-bottom: 1.5rem; /* Más espacio debajo del título de sección */
  }

  /* Estilos para los inputs de formulario */
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* Responsive grid */
    gap: 1rem; /* Espacio entre inputs */
    align-items: flex-end;
  }
  .form-grid-search {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* Responsive grid */
    gap: 1rem; /* Espacio entre inputs */
    align-items: flex-end;
  }
  .form-input {
    width: 100%;
    padding: 0.75rem 1rem; /* Más padding */
    border: 1px solid #ced4da; /* Borde suave */
    border-radius: 6px; /* Redondeado sutil */
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.075); /* Sombra interna */
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    font-size: 1rem;
    color: #495057;
  }
  .form-input:focus {
    border-color: #80bdff; /* Borde azul al enfocar */
    outline: 0;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25); /* Sombra de foco azul */
  }

  /* Mensaje de "No hay datos" */
  .no-data-message {
    text-align: center;
    font-size: 1.125rem; /* text-lg */
    color: #6c757d; /* Gris medio */
    padding: 2rem;
    background-color: #f8f9fa;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  /* Estilos de la tabla */
  .table-container {
    overflow-x-auto;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    border: 1px solid #e9ecef;
  }
  .data-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }
  .table-caption {
    padding: 1rem 1.5rem;
    font-size: 1.125rem; /* text-lg */
    font-weight: 600; /* font-semibold */
    color: #495057;
    text-align: left;
    background-color: #f8f9fa;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }
  .table-header {
    padding: 0.75rem 1.5rem;
    border-bottom: 2px solid #dee2e6;
    background-color: #e9ecef; /* Fondo más oscuro para cabeceras */
    font-size: 0.875rem; /* text-sm */
    font-weight: 600; /* font-semibold */
    color: #495057;
    text-transform: uppercase;
    letter-spacing: 0.05em; /* tracking-wider */
  }
  .table-cell {
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid #dee2e6;
    font-size: 0.9375rem; /* Un poco más grande que text-sm */
    color: #343a40;
    white-space: nowrap; /* Evita que el texto se rompa */
  }
  .data-table tbody tr:hover {
    background-color: #f2f2f2; /* Resaltado al pasar el ratón */
  }
  .table-cell.capitalize {
    text-transform: capitalize;
  }
  .actions-cell {
    text-align: right;
  }

  /* Estilos para los botones de la tabla (Editar/Eliminar) */
  .table-button {
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease-in-out;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.875rem; /* text-sm */
    font-weight: 500;
    border: none;
    cursor: pointer;
    margin-left: 0.5rem; /* Espacio entre botones */
  }
  .table-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  }
  .table-button-edit {
    background-color: #007bff; /* Azul de Bootstrap primary */
    color: white;
  }
  .table-button-edit:hover {
    background-color: #0056b3;
  }
  .table-button-delete {
    background-color: #dc3545; /* Rojo de Bootstrap danger */
    color: white;
  }
  .table-button-delete:hover {
    background-color: #c82333;
  }

  /* Estilos para el modal de confirmación */
  :global(.modal-header-custom) {
    background-color: #f8f9fa;
    color: #343a40;
    border-bottom: 1px solid #e9ecef;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    padding: 1rem 1.5rem;
  }
  :global(.modal-title-custom) {
    font-weight: 700;
    font-size: 1.25rem;
  }
  :global(.modal-body-custom) {
    color: #495057;
    padding: 1.5rem;
    font-size: 1rem;
  }
  :global(.modal-footer-custom) {
    background-color: #f8f9fa;
    border-top: 1px solid #e9ecef;
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }
  .modal-button-cancel {
    background-color: #6c757d;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    transition: all 0.2s ease-in-out;
    cursor: pointer;
  }
  .modal-button-cancel:hover {
    background-color: #5a6268;
  }
  .modal-button-confirm {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    transition: all 0.2s ease-in-out;
    cursor: pointer;
  }
  .modal-button-confirm:hover {
    background-color: #0056b3;
  }
</style>
