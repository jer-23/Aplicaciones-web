// 1. CONFIGURACIÓN DE TU CAJA FUERTE (JSONBin)
const BIN_ID = '6ab96fd8ffd5d16053354ceb';
const API_KEY = '$2a$10$pQg1WdrhXubKjuBJ5SgC0eJdgbQ6yujv1AMOt7oVyNIX9enUKIs1C';
const URL_JSONBIN = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// 2. Conectar el HTML con JavaScript
const form = document.getElementById('item-form');
const inputName = document.getElementById('item-name');
const inputQuantity = document.getElementById('item-quantity');
const inventoryBody = document.getElementById('inventory-body');

// 3. NUESTRA LISTA EN MEMORIA
// Aquí guardaremos todos los elementos antes de enviarlos a la nube
let inventario = [];

// 4. FUNCIÓN PARA DESCARGAR DATOS AL INICIAR
// Usamos 'async/await' y 'fetch' para ir a internet y esperar a que lleguen los datos
async function cargarInventario() {
    inventoryBody.innerHTML = '<tr><td colspan="3" class="empty-message">Cargando inventario desde la nube...</td></tr>';
    
    try {
        const respuesta = await fetch(URL_JSONBIN, {
            headers: { 'X-Master-Key': API_KEY } // Mostramos nuestra llave secreta
        });
        const datos = await respuesta.json();
        
        // JSONBin nos devuelve la información dentro de un paquete llamado "record"
        inventario = datos.record; 
        
        // Una vez descargada la lista, le decimos al sistema que dibuje la tabla
        dibujarTabla();
    } catch (error) {
        console.error("Error al cargar:", error);
        inventoryBody.innerHTML = '<tr><td colspan="3" class="empty-message">Error al cargar. Revisa tu conexión.</td></tr>';
    }
}

// 5. FUNCIÓN PARA GUARDAR EN LA NUBE
async function guardarEnLaNube() {
    try {
        await fetch(URL_JSONBIN, {
            method: 'PUT', // PUT significa "sobrescribir" o actualizar información
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            // Convertimos nuestra lista de memoria a un formato de texto que la nube entienda (JSON)
            body: JSON.stringify(inventario) 
        });
        console.log("¡Datos guardados en la nube exitosamente!");
    } catch (error) {
        console.error("Error al guardar:", error);
    }
}

// 6. FUNCIÓN PARA DIBUJAR LA TABLA VISUAL
function dibujarTabla() {
    // Primero, borramos todo lo que haya en la tabla visual para dibujarla de cero
    inventoryBody.innerHTML = '';
    
    if (inventario.length === 0) {
        inventoryBody.innerHTML = '<tr><td colspan="3" class="empty-message">No hay elementos en el inventario.</td></tr>';
        return; // Detenemos la función aquí si está vacío
    }
    
    // Si hay elementos, recorremos nuestra lista uno por uno
    inventario.forEach(function(item, indice) {
        const nuevaFila = document.createElement('tr');
        nuevaFila.innerHTML = `
            <td>${item.nombre}</td>
            <td>${item.cantidad}</td>
            <td>
                <!-- Le ponemos un 'data-index' para saber exactamente qué número de elemento es en la lista -->
                <button class="delete-btn" data-index="${indice}" style="background-color: #dc3545;">Eliminar</button>
            </td>
        `;
        inventoryBody.appendChild(nuevaFila);
    });

    // Darle vida a los nuevos botones de eliminar
    const botonesEliminar = document.querySelectorAll('.delete-btn');
    botonesEliminar.forEach(function(boton) {
        boton.addEventListener('click', function() {
            // Vemos qué número de elemento presionó el usuario
            const numeroElemento = boton.getAttribute('data-index');
            // Lo borramos de nuestra lista en memoria
            inventario.splice(numeroElemento, 1);
            // Volvemos a dibujar la tabla
            dibujarTabla();
            // Guardamos la nueva lista en la nube
            guardarEnLaNube();
        });
    });
}

// 7. CUANDO EL USUARIO HACE CLIC EN "GUARDAR ELEMENTO"
form.addEventListener('submit', function(evento) {
    evento.preventDefault();

    const nombreNuevo = inputName.value;
    const cantidadNueva = inputQuantity.value;

    // Metemos el nuevo elemento a nuestra lista en memoria
    inventario.push({ nombre: nombreNuevo, cantidad: cantidadNueva });
    
    // Dibujamos la tabla y guardamos en la nube
    dibujarTabla();
    guardarEnLaNube();

    // Vaciamos el formulario
    form.reset();
});

// 8. ¡ENCENDIDO!
// Esta es la primera instrucción que se ejecuta al abrir la página: ir a buscar los datos
cargarInventario();
