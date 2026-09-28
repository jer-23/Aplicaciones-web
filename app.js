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

const formTitle = document.getElementById('form-title');
const form = document.getElementById('item-form');
const inputName = document.getElementById('item-name');
const datalistNombres = document.getElementById('nombres-herramientas');
const inputQuantity = document.getElementById('item-quantity');
const inputEstado = document.getElementById('item-estado');
const inputUbicacion = document.getElementById('item-ubicacion');
const inputResponsable = document.getElementById('item-responsable');
const inventoryBody = document.getElementById('inventory-body');
const btnSubmit = document.getElementById('btn-submit');
const btnCancel = document.getElementById('btn-cancel');

const searchInput = document.getElementById('search-input');
const filterSelect = document.getElementById('filter-select');
const btnExportCSV = document.getElementById('btn-export-csv');

// Variables para Gráficos
let chartUbicacion = null;
let chartEstado = null;

// 3. VARIABLES GLOBALES EN MEMORIA
let inventario = [];
let usuarioActual = ""; 
let indiceEdicion = -1; // -1 significa que estamos creando uno nuevo. >= 0 significa que estamos editando.

// Lógica de "Responsable" obligatorio si está "Prestado"
inputUbicacion.addEventListener('change', function() {
    if (this.value === 'Prestado') {
        inputResponsable.required = true;
        inputResponsable.placeholder = "Obligatorio: Nombre de quien recibe";
    } else {
        inputResponsable.required = false;
        inputResponsable.placeholder = "Dejar en blanco si está en planta";
    }
});

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
        actualizarDatalist();
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

// Actualizar lista de autocompletado
function actualizarDatalist() {
    // Obtenemos los nombres únicos del inventario
    const nombresUnicos = [...new Set(inventario.map(item => item.nombre))];
    datalistNombres.innerHTML = '';
    nombresUnicos.forEach(nombre => {
        const option = document.createElement('option');
        option.value = nombre;
        datalistNombres.appendChild(option);
    });
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
                    <button class="edit-btn" data-index="${indiceOriginal}">Editar</button>
                    <button class="delete-btn" data-index="${indiceOriginal}">Eliminar</button>
                </td>
            `;
            inventoryBody.appendChild(nuevaFila);
        });

        // Eventos Editar
        document.querySelectorAll('.edit-btn').forEach(function(boton) {
            boton.addEventListener('click', function() {
                indiceEdicion = boton.getAttribute('data-index');
                const itemEditar = inventario[indiceEdicion];
                
                // Llenar formulario con los datos
                inputName.value = itemEditar.nombre;
                inputQuantity.value = itemEditar.cantidad;
                inputEstado.value = itemEditar.estado || 'Óptimo';
                inputUbicacion.value = itemEditar.ubicacion || 'En Planta';
                inputResponsable.value = itemEditar.responsable || '';
                
                // Disparar evento change manual para la lógica de "requerido"
                inputUbicacion.dispatchEvent(new Event('change'));

                // Cambiar apariencia del formulario
                formTitle.innerText = `Editando: ${itemEditar.nombre}`;
                btnSubmit.innerText = "Actualizar Elemento";
                btnCancel.style.display = "inline-block";
                
                // Hacer scroll suave hacia arriba
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

        // Eventos Eliminar
        document.querySelectorAll('.delete-btn').forEach(function(boton) {
            boton.addEventListener('click', function() {
                if (confirm("¿Estás seguro de eliminar este elemento?")) {
                    const numeroElemento = boton.getAttribute('data-index');
                    inventario.splice(numeroElemento, 1);
                    actualizarDatalist();
                    dibujarTabla();
                    guardarEnLaNube();
                }
            });
        });
    }

    actualizarDashboard();
}

// 8. FUNCIÓN DEL DASHBOARD ANALÍTICO (Gráficos Estéticos)
function actualizarDashboard() {
    let totalHerramientas = 0;
    let totalPrestados = 0;
    let totalAtencion = 0;

    let countPlanta = 0;
    let countPrestado = 0;

    let countOptimo = 0;
    let countReparacion = 0;
    let countDanado = 0;

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

    document.getElementById('kpi-total').innerText = totalHerramientas;
    document.getElementById('kpi-prestados').innerText = totalPrestados;
    document.getElementById('kpi-atencion').innerText = totalAtencion;

    Chart.defaults.color = '#A0A0A0';
    Chart.defaults.font.family = 'Inter';

    // Gráfico de Dona (Avanzado)
    const ctxUbicacion = document.getElementById('chart-ubicacion').getContext('2d');
    if(chartUbicacion) chartUbicacion.destroy(); 

    chartUbicacion = new Chart(ctxUbicacion, {
        type: 'doughnut',
        data: {
            labels: ['En Planta', 'Prestado'],
            datasets: [{
                data: [countPlanta, countPrestado],
                backgroundColor: ['#00E5FF', '#FF5252'],
                borderWidth: 0,
                hoverOffset: 10 // Efecto de explosión al pasar el mouse
            }]
        },
        options: {
            responsive: true,
            cutout: '75%', // Anillo más delgado y elegante
            plugins: {
                legend: { position: 'bottom', labels: { padding: 20, font: { size: 14 } } },
                tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 12, cornerRadius: 8, titleFont: { size: 14 } }
            }
        }
    });

    // Gráfico de Barras (Avanzado)
    const ctxEstado = document.getElementById('chart-estado').getContext('2d');
    if(chartEstado) chartEstado.destroy();

    chartEstado = new Chart(ctxEstado, {
        type: 'bar',
        data: {
            labels: ['Óptimo', 'En Reparación', 'Dañado'],
            datasets: [{
                label: 'Cantidad',
                data: [countOptimo, countReparacion, countDanado],
                backgroundColor: ['#00E676', '#FFD54F', '#FF5252'],
                borderWidth: 0,
                borderRadius: 6 // Bordes redondeados modernos
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 12, cornerRadius: 8 }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#333' }, ticks: { stepSize: 1 } },
                x: { grid: { display: false } }
            }
        }
    });

    // 8.4 Tabla de Resumen (Totales por Herramienta)
    const summaryBody = document.getElementById('summary-body');
    if(summaryBody) {
        summaryBody.innerHTML = '';
        
        // Agrupar cantidades por nombre
        const resumen = {};
        inventario.forEach(item => {
            const nombre = item.nombre.trim();
            const cant = parseInt(item.cantidad) || 0;
            if(resumen[nombre]) {
                resumen[nombre] += cant;
            } else {
                resumen[nombre] = cant;
            }
        });

        // Crear filas de la tabla
        for (const [nombre, total] of Object.entries(resumen)) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${nombre}</td><td><strong style="color: var(--accent-cyan); font-size: 16px;">${total}</strong></td>`;
            summaryBody.appendChild(tr);
        }
    }
}

// Botón para cancelar edición
btnCancel.addEventListener('click', function() {
    indiceEdicion = -1;
    form.reset();
    inputUbicacion.dispatchEvent(new Event('change')); // reset required state
    formTitle.innerText = "Agregar Nuevo Elemento";
    btnSubmit.innerText = "Guardar Elemento";
    btnCancel.style.display = "none";
});

// 9. CUANDO EL USUARIO HACE CLIC EN "GUARDAR" O "ACTUALIZAR"
form.addEventListener('submit', function(evento) {
    evento.preventDefault();

    const objetoGuardado = {
        nombre: inputName.value, 
        cantidad: inputQuantity.value,
        estado: inputEstado.value,
        ubicacion: inputUbicacion.value,
        responsable: inputResponsable.value,
        modificadoPor: usuarioActual,
        fechaModificacion: new Date().toLocaleDateString()
    };

    if (indiceEdicion >= 0) {
        // Estamos editando
        inventario[indiceEdicion] = objetoGuardado;
        indiceEdicion = -1; // Salir de modo edición
        formTitle.innerText = "Agregar Nuevo Elemento";
        btnSubmit.innerText = "Guardar Elemento";
        btnCancel.style.display = "none";
    } else {
        // Estamos creando nuevo
        inventario.push(objetoGuardado);
    }
    
    actualizarDatalist();
    dibujarTabla();
    guardarEnLaNube();

    form.reset();
    inputEstado.value = 'Óptimo';
    inputUbicacion.value = 'En Planta';
    inputUbicacion.dispatchEvent(new Event('change'));
});

// 10. EXPORTAR A CSV (EXCEL LATINOAMÉRICA)
btnExportCSV.addEventListener('click', function() {
    if (inventario.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }
    
    // Encabezados del CSV con \uFEFF para que Excel reconozca tildes (BOM UTF-8)
    // Usamos PUNTO Y COMA (;) porque Excel en español no entiende la coma (,)
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Nombre;Cantidad;Estado;Ubicacion;Responsable;ModificadoPor;FechaModificacion\n";
    
    // Filas
    inventario.forEach(function(rowArray) {
        let row = [
            `"${rowArray.nombre}"`, 
            rowArray.cantidad, 
            `"${rowArray.estado || 'Óptimo'}"`, 
            `"${rowArray.ubicacion || 'En Planta'}"`, 
            `"${rowArray.responsable || ''}"`, 
            `"${rowArray.modificadoPor || ''}"`, 
            `"${rowArray.fechaModificacion || ''}"`
        ];
        csvContent += row.join(";") + "\n";
    });

    // Crear un enlace invisible y forzar descarga
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventario_taller.csv");
    document.body.appendChild(link); // Requerido para Firefox
    link.click();
    document.body.removeChild(link);
});

// 11. LÓGICA DE LAS PESTAÑAS (NAVEGACIÓN SPA)
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
