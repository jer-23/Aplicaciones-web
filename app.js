// 1. CONFIGURACIÓN DE TU CAJA FUERTE (JSONBin)
const BIN_ID = '6ab96fd8ffd5d16053354ceb';
const API_KEY = '$2a$10$pQg1WdrhXubKjuBJ5SgC0eJdgbQ6yujv1AMOt7oVyNIX9enUKIs1C';
const URL_JSONBIN = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// 2. VARIABLES DEL DOM
const loginForm = document.getElementById('login-form');
const inputLoginUser = document.getElementById('login-user');
const inputLoginPass = document.getElementById('login-pass');
const loginError = document.getElementById('login-error');
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');

const form = document.getElementById('item-form');
const inputName = document.getElementById('item-name');
const inputQuantity = document.getElementById('item-quantity');
const inputEstado = document.getElementById('item-estado');
const inputUbicacion = document.getElementById('item-ubicacion');
const inputResponsable = document.getElementById('item-responsable');
const inventoryBody = document.getElementById('inventory-body');

const searchInput = document.getElementById('search-input');
const filterSelect = document.getElementById('filter-select');

// Variables para Gráficos
let chartUbicacion = null;
let chartEstado = null;

// 3. VARIABLES GLOBALES EN MEMORIA
let inventario = [];
let usuarioActual = ""; 

// 4. LÓGICA DE LOGIN (FASE 3)
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (inputLoginPass.value === 'taller123') {
        usuarioActual = inputLoginUser.value;
        loginContainer.style.display = 'none'; 
        appContainer.style.display = 'block';  
        cargarInventario();
    } else {
        loginError.style.display = 'block';
    }
});

// 5. FUNCIONES DE BASE DE DATOS (JSONBIN)
async function cargarInventario() {
    inventoryBody.innerHTML = '<tr><td colspan="7" class="empty-message">Cargando inventario desde la nube...</td></tr>';
    try {
        const respuesta = await fetch(URL_JSONBIN, {
            headers: { 'X-Master-Key': API_KEY }
        });
        const datos = await respuesta.json();
        inventario = datos.record; 
        dibujarTabla();
    } catch (error) {
        console.error("Error al cargar:", error);
        inventoryBody.innerHTML = '<tr><td colspan="7" class="empty-message">Error al cargar. Revisa tu conexión.</td></tr>';
    }
}

async function guardarEnLaNube() {
    try {
        await fetch(URL_JSONBIN, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify(inventario) 
        });
        console.log("¡Datos guardados en la nube exitosamente!");
    } catch (error) {
        console.error("Error al guardar:", error);
    }
}

// 6. EVENTOS DE FILTRO (FASE 4)
searchInput.addEventListener('input', dibujarTabla);
filterSelect.addEventListener('change', dibujarTabla);

// 7. FUNCIÓN PARA DIBUJAR LA TABLA VISUAL
function dibujarTabla() {
    inventoryBody.innerHTML = '';
    
    const textoBusqueda = searchInput.value.toLowerCase();
    const opcionFiltro = filterSelect.value;
    
    const inventarioFiltrado = inventario.filter(function(item) {
        const coincideNombre = item.nombre.toLowerCase().includes(textoBusqueda);
        
        let coincideFiltro = true;
        if (opcionFiltro === "En Planta") coincideFiltro = (item.ubicacion === "En Planta");
        if (opcionFiltro === "Prestado") coincideFiltro = (item.ubicacion === "Prestado");
        if (opcionFiltro === "Dañado") coincideFiltro = (item.estado === "Dañado");
        
        return coincideNombre && coincideFiltro;
    });

    if (inventarioFiltrado.length === 0) {
        inventoryBody.innerHTML = '<tr><td colspan="7" class="empty-message">No se encontraron elementos con esos filtros.</td></tr>';
    } else {
        inventarioFiltrado.forEach(function(item) {
            const indiceOriginal = inventario.indexOf(item);
            const nuevaFila = document.createElement('tr');
            
            let colorEstado = 'var(--accent-green)';
            if(item.estado === 'En Reparación') colorEstado = '#FFD54F'; 
            if(item.estado === 'Dañado') colorEstado = 'var(--accent-danger)'; 
            
            nuevaFila.innerHTML = `
                <td>${item.nombre}</td>
                <td>${item.cantidad}</td>
                <td style="color: ${colorEstado}; font-weight: 600;">${item.estado || 'Óptimo'}</td>
                <td>${item.ubicacion || 'En Planta'}</td>
                <td>${item.responsable || '-'}</td>
                <td style="font-size: 12px; color: var(--text-secondary);">
                    ${item.modificadoPor ? `Por: <b>${item.modificadoPor}</b><br>${item.fechaModificacion}` : 'Sistema Antiguo'}
                </td>
                <td>
                    <button class="delete-btn" data-index="${indiceOriginal}">Eliminar</button>
                </td>
            `;
            inventoryBody.appendChild(nuevaFila);
        });

        const botonesEliminar = document.querySelectorAll('.delete-btn');
        botonesEliminar.forEach(function(boton) {
            boton.addEventListener('click', function() {
                const numeroElemento = boton.getAttribute('data-index');
                inventario.splice(numeroElemento, 1);
                dibujarTabla();
                guardarEnLaNube();
            });
        });
    }

    // SIEMPRE AL FINALIZAR DE DIBUJAR LA TABLA, ACTUALIZAMOS EL DASHBOARD (FASE 5)
    actualizarDashboard();
}

// 8. FUNCIÓN DEL DASHBOARD ANALÍTICO (FASE 5)
function actualizarDashboard() {
    let totalHerramientas = 0;
    let totalPrestados = 0;
    let totalAtencion = 0;

    let countPlanta = 0;
    let countPrestado = 0;

    let countOptimo = 0;
    let countReparacion = 0;
    let countDanado = 0;

    // Calculamos los totales recorriendo la lista maestra
    inventario.forEach(item => {
        let cant = parseInt(item.cantidad) || 0;
        totalHerramientas += cant;

        if(item.ubicacion === 'Prestado') {
            totalPrestados += cant;
            countPrestado += cant;
        } else {
            countPlanta += cant;
        }

        if(item.estado === 'Dañado') {
            totalAtencion += cant;
            countDanado += cant;
        } else if (item.estado === 'En Reparación') {
            totalAtencion += cant;
            countReparacion += cant;
        } else {
            countOptimo += cant;
        }
    });

    // 8.1 Actualizar Tarjetas KPI
    document.getElementById('kpi-total').innerText = totalHerramientas;
    document.getElementById('kpi-prestados').innerText = totalPrestados;
    document.getElementById('kpi-atencion').innerText = totalAtencion;

    // Configuración global de colores para Chart.js
    Chart.defaults.color = '#A0A0A0';

    // 8.2 Gráfico de Dona (Ubicación)
    const ctxUbicacion = document.getElementById('chart-ubicacion').getContext('2d');
    if(chartUbicacion) chartUbicacion.destroy(); // Borrar el viejo antes de redibujar

    chartUbicacion = new Chart(ctxUbicacion, {
        type: 'doughnut',
        data: {
            labels: ['En Planta', 'Prestado'],
            datasets: [{
                data: [countPlanta, countPrestado],
                backgroundColor: ['#00E5FF', '#FF5252'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    // 8.3 Gráfico de Barras (Estado Físico)
    const ctxEstado = document.getElementById('chart-estado').getContext('2d');
    if(chartEstado) chartEstado.destroy();

    chartEstado = new Chart(ctxEstado, {
        type: 'bar',
        data: {
            labels: ['Óptimo', 'En Reparación', 'Dañado'],
            datasets: [{
                label: 'Cantidad de Herramientas',
                data: [countOptimo, countReparacion, countDanado],
                backgroundColor: ['#00E676', '#FFD54F', '#FF5252'],
                borderWidth: 0,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false } // Ocultamos leyenda por ser redundante
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

// 9. CUANDO EL USUARIO HACE CLIC EN "GUARDAR ELEMENTO"
form.addEventListener('submit', function(evento) {
    evento.preventDefault();

    inventario.push({ 
        nombre: inputName.value, 
        cantidad: inputQuantity.value,
        estado: inputEstado.value,
        ubicacion: inputUbicacion.value,
        responsable: inputResponsable.value,
        modificadoPor: usuarioActual,
        fechaModificacion: new Date().toLocaleDateString()
    });
    
    dibujarTabla();
    guardarEnLaNube();

    form.reset();
    inputEstado.value = 'Óptimo';
    inputUbicacion.value = 'En Planta';
});

// 10. LÓGICA DE LAS PESTAÑAS (NAVEGACIÓN SPA)
const navBotones = document.querySelectorAll('.nav-btn');
const tabContenidos = document.querySelectorAll('.tab-content');

navBotones.forEach(function(boton) {
    boton.addEventListener('click', function() {
        navBotones.forEach(btn => btn.classList.remove('active'));
        tabContenidos.forEach(tab => tab.classList.remove('active'));

        this.classList.add('active');

        const targetId = this.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
    });
});
