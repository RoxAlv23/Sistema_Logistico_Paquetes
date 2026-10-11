const API_URL = "http://127.0.0.1:8000";


// ==========================================
// LOGIN
// ==========================================

const formularioLogin =
    document.getElementById(
        "formulario-login"
    );

if (formularioLogin) {

    formularioLogin.addEventListener(
        "submit",
        async function (evento) {

            evento.preventDefault();

            const correo =
                document.getElementById(
                    "correo"
                ).value.trim();

            const password =
                document.getElementById(
                    "password"
                ).value;

            const mensaje =
                document.getElementById(
                    "mensaje-login"
                );

            mensaje.textContent =
                "Iniciando sesión...";

            try {

                const datos =
                    new URLSearchParams();

                datos.append(
                    "username",
                    correo
                );

                datos.append(
                    "password",
                    password
                );

                datos.append(
                    "grant_type",
                    "password"
                );

                const respuesta =
                    await fetch(
                        `${API_URL}/auth/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/x-www-form-urlencoded"
                            },

                            body: datos
                        }
                    );

                const resultado =
                    await respuesta.json();

                if (!respuesta.ok) {

                    mensaje.textContent =
                        resultado.detail ||
                        "Correo o contraseña incorrectos";

                    return;
                }

                // Guardar token
                localStorage.setItem(
                    "token",
                    resultado.access_token
                );

                // Obtener información del usuario
                const respuestaUsuario =
                    await fetch(
                        `${API_URL}/usuarios/`,
                        {
                            method: "GET",

                            headers: {
                                "Authorization":
                                    `Bearer ${resultado.access_token}`
                            }
                        }
                    );

                const usuarios =
                    await respuestaUsuario.json();

                if (!respuestaUsuario.ok) {

                    localStorage.removeItem(
                        "token"
                    );

                    mensaje.textContent =
                        "No se pudo verificar el usuario.";

                    return;
                }

                // Buscar el usuario que acaba de iniciar sesión
                const usuario =
                    usuarios.find(
                        usuario =>
                            usuario.correo
                                .toLowerCase() ===
                            correo.toLowerCase()
                    );

                if (!usuario) {

                    localStorage.removeItem(
                        "token"
                    );

                    mensaje.textContent =
                        "No se pudo identificar el usuario.";

                    return;
                }

                // ==========================================
                // BLOQUEAR REPARTIDOR EN EL SISTEMA WEB
                // ==========================================

                if (
                    Number(usuario.rol_id) === 3
                ) {

                    localStorage.removeItem(
                        "token"
                    );

                    mensaje.textContent =
                        "Acceso no autorizado. El repartidor debe utilizar la aplicación móvil.";

                    return;
                }

                // Guardar información básica del usuario
                localStorage.setItem(
                    "usuario",
                    JSON.stringify(usuario)
                );

                // Acceso permitido
                window.location.href =
                    "index.html";

            } catch (error) {

                console.error(
                    error
                );

                localStorage.removeItem(
                    "token"
                );

                mensaje.textContent =
                    "No se pudo conectar con el servidor";
            }

        }
    );

}

// ==========================================
// DASHBOARD
// ==========================================

async function cargarDashboard() {

    const dashboardTotal =
        document.getElementById("dashboard-total");

    if (!dashboardTotal) {
        return;
    }

    const token =
        localStorage.getItem("token");

    try {

        // ==========================================
        // OBTENER PAQUETES
        // ==========================================

        const respuestaPaquetes =
            await fetch(
                `${API_URL}/paquetes/`,
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const paquetes =
            await respuestaPaquetes.json();


        if (!respuestaPaquetes.ok) {

            console.error(
                "Error al obtener paquetes:",
                paquetes
            );

            return;
        }


        // ==========================================
        // CALCULAR ESTADÍSTICAS
        // ==========================================

        const total =
            paquetes.length;


        const enAlmacen =
            paquetes.filter(
                paquete =>
                    paquete.estado === "En almacén"
            ).length;


        const enRuta =
            paquetes.filter(
                paquete =>
                    paquete.estado === "En ruta"
            ).length;


        const entregados =
            paquetes.filter(
                paquete =>
                    paquete.estado === "Entregado"
            ).length;


        // ==========================================
        // MOSTRAR ESTADÍSTICAS
        // ==========================================

        document.getElementById(
            "dashboard-total"
        ).textContent = total;


        document.getElementById(
            "dashboard-ruta"
        ).textContent = enRuta;


        document.getElementById(
            "dashboard-entregados"
        ).textContent = entregados;


        document.getElementById(
            "dashboard-almacen"
        ).textContent = enAlmacen;


        document.getElementById(
            "dashboard-resumen-ruta"
        ).textContent = enRuta;


        document.getElementById(
            "dashboard-resumen-entregados"
        ).textContent = entregados;



        // ==========================================
        // OBTENER USUARIOS
        // ==========================================

        const respuestaUsuarios =
            await fetch(
                `${API_URL}/usuarios/`,
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const usuarios =
            await respuestaUsuarios.json();


        if (!respuestaUsuarios.ok) {

            console.error(
                "Error al obtener usuarios:",
                usuarios
            );

            return;
        }


        // ==========================================
        // CONTAR REPARTIDORES ACTIVOS
        // ==========================================

        const repartidoresActivos =
            usuarios.filter(
                usuario =>
                    usuario.rol_id === 3 &&
                    usuario.activo === true
            ).length;


        document.getElementById(
            "dashboard-repartidores"
        ).textContent =
            repartidoresActivos;



        // ==========================================
        // ACTIVIDAD RECIENTE
        // ==========================================

        const tabla =
            document.getElementById(
                "tabla-actividad-dashboard"
            );


        if (!tabla) {
            return;
        }


        tabla.innerHTML = "";


        if (paquetes.length === 0) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="4">
                        No hay paquetes registrados.
                    </td>
                </tr>
            `;

            return;
        }


        // Tomar los últimos paquetes registrados
        const paquetesRecientes =
            [...paquetes]
                .reverse()
                .slice(0, 5);


        paquetesRecientes.forEach(
            paquete => {

                const fila =
                    document.createElement("tr");


                let claseEstado = "";


                if (
                    paquete.estado ===
                    "En almacén"
                ) {

                    claseEstado =
                        "estado-en-almacen";

                } else if (
                    paquete.estado ===
                    "En ruta"
                ) {

                    claseEstado =
                        "estado-en-ruta";

                } else if (
                    paquete.estado ===
                    "Entregado"
                ) {

                    claseEstado =
                        "estado-entregado";

                }


                let clasePago = "";


                if (
                    paquete.estado_pago ===
                    "Pagado"
                ) {

                    clasePago =
                        "estado-pagado";

                } else {

                    clasePago =
                        "estado-pendiente";

                }


                fila.innerHTML = `

                    <td>
                        ${paquete.numero_guia}
                    </td>

                    <td>
                        ${paquete.destinatario}
                    </td>

                    <td>

                        <span
                            class="estado-paquete ${claseEstado}"
                        >
                            ${paquete.estado}
                        </span>

                    </td>

                    <td>

                        <span
                            class="estado-pago ${clasePago}"
                        >
                            ${paquete.estado_pago}
                        </span>

                    </td>

                `;


                tabla.appendChild(fila);

            }
        );


    } catch (error) {

        console.error(
            "Error al cargar Dashboard:",
            error
        );

    }

}


// ==========================================
// CARGAR DASHBOARD
// ==========================================

if (
    window.location.pathname.endsWith(
        "index.html"
    ) ||
    window.location.pathname === "/" ||
    window.location.pathname === ""
) {

    cargarDashboard();

}

// ==========================================
// DASHBOARD
// ==========================================

async function obtenerPaquetesDashboard() {

    const token =
        localStorage.getItem(
            "token"
        );

    if (!token) {

        window.location.href =
            "login.html";

        return;
    }

    try {

        const respuesta =
            await fetch(
                `${API_URL}/paquetes/`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        if (respuesta.status === 401) {

            localStorage.removeItem(
                "token"
            );

            window.location.href =
                "login.html";

            return;
        }

        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron obtener los paquetes"
            );
        }

        const paquetes =
            await respuesta.json();

        console.log(
            "Paquetes del Dashboard:",
            paquetes
        );

        actualizarDashboard(
            paquetes
        );


        // ==========================================
        // OBTENER USUARIOS
        // ==========================================

        const respuestaUsuarios =
            await fetch(
                `${API_URL}/usuarios/`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        if (!respuestaUsuarios.ok) {

            throw new Error(
                "No se pudieron obtener los usuarios"
            );
        }

        const usuarios =
            await respuestaUsuarios.json();

        console.log(
            "Usuarios del Dashboard:",
            usuarios
        );

        actualizarRepartidores(
            usuarios
        );

    } catch (error) {

        console.error(
            "Error al conectar con la API:",
            error
        );
    }
}


// ==========================================
// ACTUALIZAR TARJETAS DEL DASHBOARD
// ==========================================

function actualizarDashboard(
    paquetes
) {

    const tarjetas =
        document.querySelectorAll(
            ".tarjeta strong"
        );

    if (tarjetas.length < 3) {

        return;
    }

    const totalPaquetes =
        paquetes.length;

    const enRuta =
        paquetes.filter(
            paquete =>
                paquete.estado === "En ruta"
        ).length;

    const entregados =
        paquetes.filter(
            paquete =>
                paquete.estado === "Entregado"
        ).length;

    tarjetas[0].textContent =
        totalPaquetes;

    tarjetas[1].textContent =
        enRuta;

    tarjetas[2].textContent =
        entregados;
}


// ==========================================
// ACTUALIZAR REPARTIDORES
// ==========================================

function actualizarRepartidores(
    usuarios
) {

    const tarjetas =
        document.querySelectorAll(
            ".tarjeta strong"
        );

    if (tarjetas.length < 4) {

        return;
    }

    const repartidores =
        usuarios.filter(
            usuario =>
                usuario.rol_id === 3
        ).length;

    tarjetas[3].textContent =
        repartidores;
}


// ==========================================
// EJECUTAR DASHBOARD
// ==========================================

if (
    window.location.pathname.endsWith(
        "index.html"
    )
) {

    obtenerPaquetesDashboard();

}


// ==========================================
// USUARIOS
// ==========================================

async function obtenerUsuarios() {

    const token =
        localStorage.getItem(
            "token"
        );

    if (!token) {

        window.location.href =
            "login.html";

        return;
    }

    try {

        const respuesta =
            await fetch(
                `${API_URL}/usuarios/`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        if (respuesta.status === 401) {

            localStorage.removeItem(
                "token"
            );

            window.location.href =
                "login.html";

            return;
        }

        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron obtener los usuarios"
            );
        }

        const usuarios =
    await respuesta.json();


usuariosDashboard =
    usuarios;


mostrarUsuarios(
    usuarios
);

        
    } catch (error) {

        console.error(
            "Error al obtener usuarios:",
            error
        );
    }
}


// ==========================================
// MOSTRAR USUARIOS
// ==========================================

function mostrarUsuarios(
    usuarios
) {

    const tabla =
        document.getElementById(
            "tabla-usuarios"
        );

    if (!tabla) {

        return;
    }


    tabla.innerHTML = "";


    if (usuarios.length === 0) {

        tabla.innerHTML = `
            <tr>
                <td colspan="6">
                    No hay usuarios que coincidan con la búsqueda.
                </td>
            </tr>
        `;

        return;
    }


    usuarios.forEach(
        usuario => {

            const fila =
                document.createElement(
                    "tr"
                );


            // ==========================================
            // NOMBRE DEL ROL
            // ==========================================

            let nombreRol =
                "Desconocido";


            if (
                usuario.rol_id === 1
            ) {

                nombreRol =
                    "Administrador";

            } else if (
                usuario.rol_id === 2
            ) {

                nombreRol =
                    "Personal de oficina";

            } else if (
                usuario.rol_id === 3
            ) {

                nombreRol =
                    "Repartidor";

            }


            // ==========================================
            // ESTADO
            // ==========================================

            const estado =
                usuario.activo
                    ? "Activo"
                    : "Inactivo";


            // ==========================================
            // MOSTRAR FILA
            // ==========================================

            fila.innerHTML = `

                <td>
                    ${usuario.id}
                </td>

                <td>
                    ${usuario.nombre}
                </td>

                <td>
                    ${usuario.correo}
                </td>

                <td>
                    ${nombreRol}
                </td>

                <td>

                    <span
                        class="${
                            usuario.activo
                                ? "estado-usuario-activo"
                                : "estado-usuario-inactivo"
                        }"
                    >
                        ${estado}
                    </span>

                </td>

                <td>

                    <button
                        type="button"
                        class="btn-tabla"
                        onclick="editarUsuario(${usuario.id})"
                    >
                        Editar
                    </button>

                </td>

            `;


            tabla.appendChild(
                fila
            );

        }
    );

}

// ==========================================
// FILTROS DE USUARIOS
// ==========================================

let usuariosDashboard = [];


function aplicarFiltrosUsuarios() {

    const buscador =
        document.getElementById(
            "buscar-usuario"
        );


    const filtroRol =
        document.getElementById(
            "filtro-rol"
        );


    if (
        !buscador ||
        !filtroRol
    ) {

        return;
    }


    const texto =
        buscador.value
            .toLowerCase()
            .trim();


    const rolSeleccionado =
        filtroRol.value;


    const usuariosFiltrados =
        usuariosDashboard.filter(
            usuario => {

                const coincideTexto =
                    usuario.nombre
                        .toLowerCase()
                        .includes(texto) ||

                    usuario.correo
                        .toLowerCase()
                        .includes(texto);


                const coincideRol =
                    rolSeleccionado === "" ||

                    String(
                        usuario.rol_id
                    ) === rolSeleccionado;


                return (
                    coincideTexto &&
                    coincideRol
                );

            }
        );


    mostrarUsuarios(
        usuariosFiltrados
    );

}

// ==========================================
// EDITAR USUARIO
// ==========================================

async function editarUsuario(
    usuarioId
) {

    const token =
        localStorage.getItem(
            "token"
        );

    try {

        const respuesta =
            await fetch(
                `${API_URL}/usuarios/${usuarioId}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const usuario =
            await respuesta.json();

        if (!respuesta.ok) {

            alert(
                usuario.detail ||
                "No se pudo obtener el usuario"
            );

            return;
        }


        document.getElementById(
            "editar-id"
        ).value =
            usuario.id;


        document.getElementById(
            "editar-nombre"
        ).value =
            usuario.nombre;


        document.getElementById(
            "editar-correo"
        ).value =
            usuario.correo;


        document.getElementById(
            "editar-rol"
        ).value =
            usuario.rol_id;


        document.getElementById(
            "editar-estado"
        ).value =
            usuario.activo
                ? "true"
                : "false";


        const mensaje =
            document.getElementById(
                "mensaje-editar-usuario"
            );

        if (mensaje) {

            mensaje.textContent =
                "";

            mensaje.style.color =
                "";
        }


        const modal =
            document.getElementById(
                "modal-editar-usuario"
            );

        if (modal) {

            modal.style.display =
                "flex";
        }

    } catch (error) {

        console.error(
            "Error al obtener usuario:",
            error
        );

        alert(
            "No se pudo conectar con el servidor"
        );
    }
}


// ==========================================
// CERRAR EDICIÓN DE USUARIO
// ==========================================

function cerrarFormularioEditarUsuario() {

    const modal =
        document.getElementById(
            "modal-editar-usuario"
        );

    if (modal) {

        modal.style.display =
            "none";
    }
}


// ==========================================
// EJECUTAR USUARIOS
// ==========================================

if (
    window.location.pathname.endsWith(
        "usuarios.html"
    )
) {

    obtenerUsuarios();

}


// ==========================================
// FORMULARIO NUEVO USUARIO
// ==========================================

function mostrarFormularioUsuario() {

    const modal =
        document.getElementById(
            "modal-usuario"
        );

    if (modal) {

        modal.style.display =
            "flex";
    }
}


// ==========================================
// CERRAR FORMULARIO USUARIO
// ==========================================

function cerrarFormularioUsuario() {

    const modal =
        document.getElementById(
            "modal-usuario"
        );

    if (modal) {

        modal.style.display =
            "none";
    }
}


// ==========================================
// CREAR USUARIO
// ==========================================

const formularioUsuario =
    document.getElementById(
        "formulario-usuario"
    );

if (formularioUsuario) {

    formularioUsuario.addEventListener(
        "submit",
        async function (evento) {

            evento.preventDefault();

            const token =
                localStorage.getItem(
                    "token"
                );

            const nombre =
                document.getElementById(
                    "nuevo-nombre"
                ).value;

            const correo =
                document.getElementById(
                    "nuevo-correo"
                ).value;

            const password =
                document.getElementById(
                    "nuevo-password"
                ).value;

            const rol_id =
                Number(
                    document.getElementById(
                        "nuevo-rol"
                    ).value
                );

            const mensaje =
                document.getElementById(
                    "mensaje-usuario"
                );

            mensaje.style.color =
                "";

            mensaje.textContent =
                "Guardando usuario...";


            try {

                const respuesta =
                    await fetch(
                        `${API_URL}/usuarios/`,
                        {
                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`
                            },

                            body: JSON.stringify({

                                nombre:
                                    nombre,

                                correo:
                                    correo,

                                password:
                                    password,

                                rol_id:
                                    rol_id

                            })
                        }
                    );


                const resultado =
                    await respuesta.json();


                if (!respuesta.ok) {

                    console.error(
                        "Error:",
                        resultado
                    );

                    mensaje.style.color =
                        "red";

                    mensaje.textContent =
                        resultado.detail ||
                        "No se pudo crear el usuario";

                    return;
                }


                mensaje.style.color =
                    "green";

                mensaje.textContent =
                    "Usuario creado correctamente";


                formularioUsuario.reset();


                setTimeout(
                    function () {

                        cerrarFormularioUsuario();

                        obtenerUsuarios();

                        mensaje.style.color =
                            "";

                        mensaje.textContent =
                            "";

                    },
                    1000
                );


            } catch (error) {

                console.error(
                    "Error al crear usuario:",
                    error
                );

                mensaje.style.color =
                    "red";

                mensaje.textContent =
                    "No se pudo conectar con el servidor";
            }

        }
    );

}


// ==========================================
// GUARDAR CAMBIOS DE USUARIO
// ==========================================

const formularioEditarUsuario =
    document.getElementById(
        "formulario-editar-usuario"
    );

if (formularioEditarUsuario) {

    formularioEditarUsuario.addEventListener(
        "submit",
        async function (evento) {

            evento.preventDefault();

            const token =
                localStorage.getItem(
                    "token"
                );

            const id =
                document.getElementById(
                    "editar-id"
                ).value;

            const nombre =
                document.getElementById(
                    "editar-nombre"
                ).value;

            const correo =
                document.getElementById(
                    "editar-correo"
                ).value;

            const rol_id =
                Number(
                    document.getElementById(
                        "editar-rol"
                    ).value
                );

            const activo =
                document.getElementById(
                    "editar-estado"
                ).value === "true";


            const mensaje =
                document.getElementById(
                    "mensaje-editar-usuario"
                );


            mensaje.style.color =
                "";

            mensaje.textContent =
                "Guardando cambios...";


            try {

                const respuesta =
                    await fetch(
                        `${API_URL}/usuarios/${id}`,
                        {
                            method: "PUT",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`
                            },

                            body: JSON.stringify({

                                nombre:
                                    nombre,

                                correo:
                                    correo,

                                rol_id:
                                    rol_id,

                                activo:
                                    activo

                            })
                        }
                    );


                const resultado =
                    await respuesta.json();


                if (!respuesta.ok) {

                    console.error(
                        "Error:",
                        resultado
                    );

                    mensaje.style.color =
                        "red";

                    mensaje.textContent =
                        resultado.detail ||
                        "No se pudieron guardar los cambios";

                    return;
                }


                mensaje.style.color =
                    "green";

                mensaje.textContent =
                    "Usuario actualizado correctamente";


                setTimeout(
                    function () {

                        cerrarFormularioEditarUsuario();

                        obtenerUsuarios();

                        mensaje.textContent =
                            "";

                        mensaje.style.color =
                            "";

                    },
                    1000
                );


            } catch (error) {

                console.error(
                    "Error al editar usuario:",
                    error
                );

                mensaje.style.color =
                    "red";

                mensaje.textContent =
                    "No se pudo conectar con el servidor";
            }

        }
    );

}


// ==========================================
// PAQUETES
// ==========================================

// ==========================================
// MOSTRAR FORMULARIO NUEVO PAQUETE
// ==========================================
// ==========================================
// CERRAR FORMULARIO NUEVO PAQUETE
// ==========================================

function cerrarFormularioPaquete() {

    const modal =
        document.getElementById(
            "modal-paquete"
        );

    if (modal) {

        modal.style.display =
            "none";
    }
}

function mostrarFormularioPaquete() {

    const formulario =
        document.getElementById(
            "formulario-paquete"
        );

    if (formulario) {

        formulario.reset();
    }

    const mensaje =
        document.getElementById(
            "mensaje-paquete"
        );

    if (mensaje) {

        mensaje.textContent =
            "";

        mensaje.style.color =
            "";
    }

    const modal =
        document.getElementById(
            "modal-paquete"
        );

    if (modal) {

        modal.style.display =
            "flex";
    }
}

let paquetesRegistrados = [];

async function obtenerPaquetes() {

    const token =
        localStorage.getItem(
            "token"
        );

    const tabla =
        document.getElementById(
            "tabla-paquetes"
        );

    if (!tabla) {

        return;
    }


    if (!token) {

        window.location.href =
            "login.html";

        return;
    }


    try {

        const respuesta =
            await fetch(
                `${API_URL}/paquetes/`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (respuesta.status === 401) {

            localStorage.removeItem(
                "token"
            );

            window.location.href =
                "login.html";

            return;
        }


        const paquetes =
            await respuesta.json();

            paquetesRegistrados = paquetes;


        if (!respuesta.ok) {

            console.error(
                "Error al obtener paquetes:",
                paquetes
            );

            tabla.innerHTML = `
                <tr>
                    <td colspan="8">
                        No se pudieron cargar los paquetes.
                    </td>
                </tr>
            `;

            return;
        }


        mostrarPaquetes(
            paquetes
        );


    } catch (error) {

        console.error(
            "Error al obtener paquetes:",
            error
        );


        tabla.innerHTML = `
            <tr>
                <td colspan="8">
                    No se pudo conectar con el servidor.
                </td>
            </tr>
        `;
    }
}


// ==========================================
// FILTROS DE PAQUETES
// ==========================================

function aplicarFiltrosPaquetes() {

    const buscador =
        document.getElementById(
            "buscar-paquete"
        );

    const filtroEstado =
        document.getElementById(
            "filtro-estado-paquete"
        );

    const filtroPago =
        document.getElementById(
            "filtro-pago-paquete"
        );

    if (
        !buscador ||
        !filtroEstado ||
        !filtroPago
    ) {
        return;
    }

    const texto =
        buscador.value
            .toLowerCase()
            .trim();

    const estadoSeleccionado =
        filtroEstado.value;

    const pagoSeleccionado =
        filtroPago.value;

    const paquetesFiltrados =
        paquetesRegistrados.filter(
            paquete => {

                const coincideTexto =
                    paquete.numero_guia
                        .toLowerCase()
                        .includes(texto) ||

                    paquete.remitente
                        .toLowerCase()
                        .includes(texto) ||

                    paquete.destinatario
                        .toLowerCase()
                        .includes(texto);

                const coincideEstado =
                    estadoSeleccionado === "" ||
                    paquete.estado ===
                        estadoSeleccionado;

                const coincidePago =
                    pagoSeleccionado === "" ||
                    paquete.estado_pago ===
                        pagoSeleccionado;

                return (
                    coincideTexto &&
                    coincideEstado &&
                    coincidePago
                );
            }
        );

    mostrarPaquetes(
        paquetesFiltrados
    );
}


// ==========================================
// EVENTOS DE FILTROS DE PAQUETES
// ==========================================

const buscadorPaquete =
    document.getElementById(
        "buscar-paquete"
    );

const filtroEstadoPaquete =
    document.getElementById(
        "filtro-estado-paquete"
    );

const filtroPagoPaquete =
    document.getElementById(
        "filtro-pago-paquete"
    );


if (buscadorPaquete) {

    buscadorPaquete.addEventListener(
        "input",
        aplicarFiltrosPaquetes
    );
}


if (filtroEstadoPaquete) {

    filtroEstadoPaquete.addEventListener(
        "change",
        aplicarFiltrosPaquetes
    );
}


if (filtroPagoPaquete) {

    filtroPagoPaquete.addEventListener(
        "change",
        aplicarFiltrosPaquetes
    );
}

// ==========================================
// MOSTRAR PAQUETES
// ==========================================

function mostrarPaquetes(paquetes) {

    const tabla =
        document.getElementById(
            "tabla-paquetes"
        );

    if (!tabla) {
        return;
    }

    tabla.innerHTML = "";

    if (paquetes.length === 0) {

        tabla.innerHTML = `
            <tr>
                <td colspan="9">
                    No hay paquetes registrados.
                </td>
            </tr>
        `;

        return;
    }

    paquetes.forEach(
        paquete => {

            const fila =
                document.createElement("tr");


            // ==========================================
            // CLASE ESTADO PAQUETE
            // ==========================================

            const claseEstado =
                paquete.estado
                    .toLowerCase()
                    .replace(/ /g, "-")
                    .replace(/á/g, "a")
                    .replace(/é/g, "e")
                    .replace(/í/g, "i")
                    .replace(/ó/g, "o")
                    .replace(/ú/g, "u");


            // ==========================================
            // CLASE ESTADO PAGO
            // ==========================================

            const clasePago =
                paquete.estado_pago
                    .toLowerCase()
                    .replace(/ /g, "-");


            // ==========================================
            // TOTAL
            // ==========================================

            const total =
                Number(
                    paquete.total || 0
                ).toFixed(2);


            fila.innerHTML = `

                <td>
                    ${paquete.id}
                </td>

                <td>
                    ${paquete.numero_guia}
                </td>

                <td>
                    ${paquete.remitente}
                </td>

                <td>
                    ${paquete.destinatario}
                </td>

                <td>
                    ${paquete.telefono_destinatario}
                </td>

                <td>
                    $${total}
                </td>

                <td>
                    <span
                        class="estado-paquete estado-${claseEstado}"
                    >
                        ${paquete.estado}
                    </span>
                </td>

                <td>
                    <span
                        class="estado-pago estado-${clasePago}"
                    >
                        ${paquete.estado_pago}
                    </span>
                </td>

                <td>

                    <button
                        type="button"
                        class="btn-tabla"
                        onclick="editarPaquete(${paquete.id})"
                    >
                        Editar
                    </button>

                </td>

            `;

            tabla.appendChild(
                fila
            );

        }
    );
}


// ==========================================
// EJECUTAR PAQUETES
// ==========================================

if (
    window.location.pathname.endsWith(
        "paquetes.html"
    )
) {

    obtenerPaquetes();

    cargarClientes();

}


// ==========================================
// CLIENTES
// ==========================================

let clientesRegistrados = [];


// ==========================================
// CARGAR CLIENTES
// ==========================================

async function cargarClientes() {

    const selector =
        document.getElementById(
            "nuevo-remitente"
        );

    if (!selector) {
        return;
    }

    const token =
        localStorage.getItem("token");

    try {

        const respuesta =
            await fetch(
                `${API_URL}/clientes/`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const clientes =
            await respuesta.json();

        if (!respuesta.ok) {

            console.error(
                "No se pudieron cargar los clientes:",
                clientes
            );

            return;
        }

        clientesRegistrados =
            clientes;

        selector.innerHTML = `
            <option value="">
                Seleccionar cliente...
            </option>
        `;

        clientes.forEach(
            cliente => {

                const opcion =
                    document.createElement(
                        "option"
                    );

                opcion.value =
                    cliente.id;

                opcion.textContent =
                    cliente.nombre;

                selector.appendChild(
                    opcion
                );

            }
        );

    } catch (error) {

        console.error(
            "Error al cargar clientes:",
            error
        );

    }
}


// ==========================================
// SELECCIONAR CLIENTE
// ==========================================

const selectorRemitente =
    document.getElementById(
        "nuevo-remitente"
    );

if (selectorRemitente) {

    selectorRemitente.addEventListener(
        "change",
        function () {

            const clienteId =
                Number(
                    this.value
                );

            const cliente =
                clientesRegistrados.find(
                    cliente =>
                        cliente.id ===
                        clienteId
                );

            const telefono =
                document.getElementById(
                    "nuevo-telefono-remitente"
                );

            const direccion =
                document.getElementById(
                    "nueva-direccion-remitente"
                );

            const clienteIdOculto =
                document.getElementById(
                    "nuevo-cliente-id"
                );


            if (!cliente) {

                if (telefono) {
                    telefono.value = "";
                }

                if (direccion) {
                    direccion.value = "";
                }

                if (clienteIdOculto) {
                    clienteIdOculto.value = "";
                }

                return;
            }


            // Teléfono del cliente
            if (telefono) {
                telefono.value =
                    cliente.telefono;
            }


            // Dirección del cliente
            if (direccion) {
                direccion.value =
                    cliente.direccion;
            }


            // ID del cliente
            if (clienteIdOculto) {
                clienteIdOculto.value =
                    cliente.id;
            }

        }
    );

}


// ==========================================
// MOSTRAR FORMULARIO DE NUEVO CLIENTE
// ==========================================

function mostrarFormularioCliente() {

    const modalCliente =
        document.getElementById(
            "modal-cliente"
        );

    const formulario =
        document.getElementById(
            "formulario-cliente"
        );

    const mensaje =
        document.getElementById(
            "mensaje-cliente"
        );


    if (formulario) {
        formulario.reset();
    }

    if (mensaje) {
        mensaje.textContent = "";
        mensaje.style.color = "";
    }

    if (modalCliente) {
        modalCliente.style.display =
            "flex";
    }

}


// ==========================================
// CERRAR FORMULARIO DE CLIENTE
// ==========================================

function cerrarFormularioCliente() {

    const modalCliente =
        document.getElementById(
            "modal-cliente"
        );

    if (modalCliente) {
        modalCliente.style.display =
            "none";
    }

}


// ==========================================
// GUARDAR NUEVO CLIENTE
// ==========================================

const formularioCliente =
    document.getElementById(
        "formulario-cliente"
    );

if (formularioCliente) {

    formularioCliente.addEventListener(
        "submit",
        async function (evento) {

            evento.preventDefault();

            const token =
                localStorage.getItem(
                    "token"
                );


            const nombre =
                document.getElementById(
                    "nuevo-cliente-nombre"
                ).value.trim();


            const telefono =
                document.getElementById(
                    "nuevo-cliente-telefono"
                ).value.trim();


            const direccion =
                document.getElementById(
                    "nuevo-cliente-direccion"
                ).value.trim();


            const mensaje =
                document.getElementById(
                    "mensaje-cliente"
                );


            mensaje.style.color = "";

            mensaje.textContent =
                "Guardando cliente...";


            try {

                const respuesta =
                    await fetch(
                        `${API_URL}/clientes/`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`
                            },

                            body: JSON.stringify({

                                nombre:
                                    nombre,

                                telefono:
                                    telefono,

                                direccion:
                                    direccion

                            })
                        }
                    );


                const resultado =
                    await respuesta.json();


                console.log(
                    "Respuesta API cliente:",
                    resultado
                );


                if (!respuesta.ok) {

                    mensaje.style.color =
                        "red";

                    mensaje.textContent =
                        resultado.detail ||
                        "No se pudo crear el cliente";

                    return;
                }


                mensaje.style.color =
                    "green";

                mensaje.textContent =
                    "Cliente creado correctamente";


                // ==========================================
                // RECARGAR CLIENTES
                // ==========================================

                await cargarClientes();


                // ==========================================
                // SELECCIONAR AUTOMÁTICAMENTE
                // EL CLIENTE RECIÉN CREADO
                // ==========================================

                const selector =
                    document.getElementById(
                        "nuevo-remitente"
                    );


                if (selector) {

                    selector.value =
                        resultado.id;


                    selector.dispatchEvent(
                        new Event("change")
                    );

                }


                // ==========================================
                // CERRAR MODAL DE CLIENTE
                // ==========================================

                setTimeout(
                    function () {

                        cerrarFormularioCliente();

                        mensaje.textContent =
                            "";

                        mensaje.style.color =
                            "";

                    },
                    700
                );


            } catch (error) {

                console.error(
                    "Error al crear cliente:",
                    error
                );


                mensaje.style.color =
                    "red";

                mensaje.textContent =
                    "No se pudo conectar con el servidor";

            }

        }
    );

}


// ==========================================
// GUARDAR NUEVO PAQUETE
// ==========================================

const formularioPaquete =
    document.getElementById(
        "formulario-paquete"
    );

if (formularioPaquete) {

    formularioPaquete.addEventListener(
        "submit",
        async function (evento) {

            evento.preventDefault();


            const token =
                localStorage.getItem(
                    "token"
                );


            // ==========================================
            // CLIENTE
            // ==========================================

            const clienteId =
                Number(
                    document.getElementById(
                        "nuevo-remitente"
                    ).value
                );


            // ==========================================
            // DESTINATARIO
            // ==========================================

            const destinatario =
                document.getElementById(
                    "nuevo-destinatario"
                ).value.trim();


            const telefono_destinatario =
                document.getElementById(
                    "nuevo-telefono"
                ).value.trim();


            const direccion_entrega =
                document.getElementById(
                    "nueva-direccion"
                ).value.trim();


            // ==========================================
            // TOTAL
            // ==========================================

            const total =
                Number(
                    document.getElementById(
                        "nuevo-total"
                    ).value
                );


            // ==========================================
            // PAGO
            // ==========================================

            const estado_pago =
                document.getElementById(
                    "nuevo-pago"
                ).value;


            const mensaje =
                document.getElementById(
                    "mensaje-paquete"
                );


            // ==========================================
            // VALIDACIONES
            // ==========================================

            if (!clienteId) {

                mensaje.style.color =
                    "red";

                mensaje.textContent =
                    "Debe seleccionar un cliente.";

                return;
            }


            if (
                isNaN(total) ||
                total < 0
            ) {

                mensaje.style.color =
                    "red";

                mensaje.textContent =
                    "Ingrese un total válido.";

                return;
            }


            mensaje.style.color = "";

            mensaje.textContent =
                "Guardando paquete...";


            try {

                const respuesta =
                    await fetch(
                        `${API_URL}/paquetes/`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`
                            },

                            body: JSON.stringify({

                                cliente_id:
                                    clienteId,

                                remitente:
                                    document.getElementById(
                                        "nuevo-remitente"
                                    ).options[
                                        document.getElementById(
                                            "nuevo-remitente"
                                        ).selectedIndex
                                    ].text,

                                destinatario:
                                    destinatario,

                                telefono_destinatario:
                                    telefono_destinatario,

                                direccion_entrega:
                                    direccion_entrega,

                                total:
                                    total,

                                estado_pago:
                                    estado_pago

                            })
                        }
                    );


                const resultado =
                    await respuesta.json();


                console.log(
                    "Respuesta API:",
                    resultado
                );


                if (!respuesta.ok) {

                    mensaje.style.color =
                        "red";

                    mensaje.textContent =
                        resultado.detail ||
                        "No se pudo crear el paquete";

                    return;
                }


                mensaje.style.color =
                    "green";

                mensaje.textContent =
                    "Paquete creado correctamente";


                formularioPaquete.reset();


                document.getElementById(
                    "nuevo-telefono-remitente"
                ).value = "";


                document.getElementById(
                    "nueva-direccion-remitente"
                ).value = "";


                document.getElementById(
                    "nuevo-cliente-id"
                ).value = "";


                setTimeout(
                    function () {

                        cerrarFormularioPaquete();

                        obtenerPaquetes();

                        mensaje.textContent =
                            "";

                        mensaje.style.color =
                            "";

                    },
                    1000
                );


            } catch (error) {

                console.error(
                    "Error al crear paquete:",
                    error
                );


                mensaje.style.color =
                    "red";

                mensaje.textContent =
                    "No se pudo conectar con el servidor";

            }

        }
    );

}


// ==========================================
// EDITAR PAQUETE
// ==========================================

function cerrarFormularioEditarPaquete() {

    const modal =
        document.getElementById(
            "modal-editar-paquete"
        );

    if (modal) {
        modal.style.display =
            "none";
    }

}


async function editarPaquete(
    paqueteId
) {

    const token =
        localStorage.getItem(
            "token"
        );


    try {

        const respuesta =
            await fetch(
                `${API_URL}/paquetes/${paqueteId}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const paquete =
            await respuesta.json();


        if (!respuesta.ok) {

            alert(
                paquete.detail ||
                "No se pudo obtener el paquete"
            );

            return;
        }


        document.getElementById(
            "editar-paquete-id"
        ).value =
            paquete.id;


        document.getElementById(
            "editar-paquete-guia"
        ).value =
            paquete.numero_guia;


        document.getElementById(
            "editar-paquete-remitente"
        ).value =
            paquete.remitente;


        document.getElementById(
            "editar-paquete-destinatario"
        ).value =
            paquete.destinatario;


        document.getElementById(
            "editar-paquete-telefono"
        ).value =
            paquete.telefono_destinatario;


        document.getElementById(
            "editar-paquete-direccion"
        ).value =
            paquete.direccion_entrega;


        document.getElementById(
            "editar-paquete-total"
        ).value =
            paquete.total || 0;


        document.getElementById(
            "editar-paquete-pago"
        ).value =
            paquete.estado_pago;


        document.getElementById(
            "editar-paquete-estado"
        ).value =
            paquete.estado;


        const mensaje =
            document.getElementById(
                "mensaje-editar-paquete"
            );


        if (mensaje) {

            mensaje.textContent =
                "";

            mensaje.style.color =
                "";

        }


        const modal =
            document.getElementById(
                "modal-editar-paquete"
            );


        if (modal) {

            modal.style.display =
                "flex";

        }


    } catch (error) {

        console.error(
            "Error al obtener paquete:",
            error
        );

        alert(
            "No se pudo conectar con el servidor"
        );

    }

}


// ==========================================
// GUARDAR CAMBIOS DEL PAQUETE
// ==========================================

const formularioEditarPaquete =
    document.getElementById(
        "formulario-editar-paquete"
    );


if (formularioEditarPaquete) {

    formularioEditarPaquete.addEventListener(
        "submit",
        async function (evento) {

            evento.preventDefault();


            const token =
                localStorage.getItem(
                    "token"
                );


            const id =
                document.getElementById(
                    "editar-paquete-id"
                ).value;


            const telefono_destinatario =
                document.getElementById(
                    "editar-paquete-telefono"
                ).value.trim();


            const direccion_entrega =
                document.getElementById(
                    "editar-paquete-direccion"
                ).value.trim();


            const total =
                Number(
                    document.getElementById(
                        "editar-paquete-total"
                    ).value
                );


            const estado_pago =
                document.getElementById(
                    "editar-paquete-pago"
                ).value;


            const estado =
                document.getElementById(
                    "editar-paquete-estado"
                ).value;


            const mensaje =
                document.getElementById(
                    "mensaje-editar-paquete"
                );


            if (
                isNaN(total) ||
                total < 0
            ) {

                mensaje.style.color =
                    "red";

                mensaje.textContent =
                    "Ingrese un total válido.";

                return;
            }


            mensaje.style.color = "";

            mensaje.textContent =
                "Guardando cambios...";


            try {

                const respuesta =
                    await fetch(
                        `${API_URL}/paquetes/${id}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`
                            },

                            body: JSON.stringify({

                                telefono_destinatario:
                                    telefono_destinatario,

                                direccion_entrega:
                                    direccion_entrega,

                                total:
                                    total,

                                estado_pago:
                                    estado_pago,

                                estado:
                                    estado

                            })
                        }
                    );


                const resultado =
                    await respuesta.json();


                console.log(
                    "Respuesta API:",
                    resultado
                );


                if (!respuesta.ok) {

                    mensaje.style.color =
                        "red";

                    mensaje.textContent =
                        resultado.detail ||
                        "No se pudieron guardar los cambios";

                    return;
                }


                mensaje.style.color =
                    "green";

                mensaje.textContent =
                    "Paquete actualizado correctamente";


                setTimeout(
                    function () {

                        cerrarFormularioEditarPaquete();

                        obtenerPaquetes();

                        mensaje.textContent =
                            "";

                        mensaje.style.color =
                            "";

                    },
                    1000
                );


            } catch (error) {

                console.error(
                    "Error al actualizar paquete:",
                    error
                );


                mensaje.style.color =
                    "red";

                mensaje.textContent =
                    "No se pudo conectar con el servidor";

            }

        }
    );

}


// ==========================================
// MOSTRAR FORMULARIO NUEVA RUTA
// ==========================================

function mostrarFormularioRuta() {

    const modal =
        document.getElementById(
            "modal-ruta"
        );

    if (modal) {

        modal.style.display = "flex";

        obtenerRepartidoresRuta();
    }
}

// ==========================================
// CERRAR FORMULARIO NUEVA RUTA
// ==========================================

function cerrarFormularioRuta() {

    const modal =
        document.getElementById(
            "modal-ruta"
        );

    if (modal) {

        modal.style.display = "none";
    }
}
// ==========================================
// CARGAR REPARTIDORES PARA NUEVA RUTA
// ==========================================

async function obtenerRepartidoresRuta() {

    const token =
        localStorage.getItem("token");

    const select =
        document.getElementById(
            "nueva-ruta-repartidor"
        );

    if (!select) {
        return;
    }

    try {

        const respuesta =
            await fetch(
                `${API_URL}/usuarios/`,
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const usuarios =
            await respuesta.json();

        if (!respuesta.ok) {

            console.error(
                "No se pudieron obtener los usuarios:",
                usuarios
            );

            return;
        }

        select.innerHTML = `
            <option value="">
                Selecciona un repartidor
            </option>
        `;

        usuarios
            .filter(
                usuario =>
                    usuario.rol_id === 3 &&
                    usuario.activo === true
            )
            .forEach(
                usuario => {

                    const opcion =
                        document.createElement(
                            "option"
                        );

                    opcion.value =
                        usuario.id;

                    opcion.textContent =
                        usuario.nombre;

                    select.appendChild(
                        opcion
                    );
                }
            );

    } catch (error) {

        console.error(
            "Error al cargar repartidores:",
            error
        );
    }
}
// ==========================================
// VER DETALLE DE RUTA
// ==========================================

async function verRuta(rutaId) {

    const token =
        localStorage.getItem("token");

    try {

        const respuesta =
            await fetch(
                `${API_URL}/rutas/${rutaId}`,
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const ruta =
            await respuesta.json();

        if (!respuesta.ok) {

            alert(
                ruta.detail ||
                "No se pudo obtener la ruta"
            );

            return;
        }

        document.getElementById(
            "detalle-ruta-id"
        ).value = ruta.id;

        document.getElementById(
            "detalle-ruta-nombre"
        ).value = ruta.nombre;

        document.getElementById(
            "detalle-ruta-repartidor"
        ).value =
            obtenerNombreRepartidor(
                ruta.repartidor_id
            );

        const modal =
            document.getElementById(
                "modal-ver-ruta"
            );

        if (modal) {

            modal.style.display =
                "flex";
        }

    } catch (error) {

        console.error(
            "Error al obtener ruta:",
            error
        );

        alert(
            "No se pudo conectar con el servidor"
        );
    }
}


// ==========================================
// CERRAR DETALLE DE RUTA
// ==========================================

function cerrarDetalleRuta() {

    const modal =
        document.getElementById(
            "modal-ver-ruta"
        );

    if (modal) {

        modal.style.display =
            "none";
    }
}

// ==========================================
// GUARDAR NUEVA RUTA
// ==========================================

const formularioRuta =
    document.getElementById(
        "formulario-ruta"
    );

if (formularioRuta) {

    formularioRuta.addEventListener(
        "submit",
        async function (evento) {

            evento.preventDefault();

            const token =
                localStorage.getItem("token");

            const nombre =
                document.getElementById(
                    "nueva-ruta-nombre"
                ).value;

            const repartidor_id =
                document.getElementById(
                    "nueva-ruta-repartidor"
                ).value;

            const mensaje =
                document.getElementById(
                    "mensaje-ruta"
                );

            mensaje.style.color = "";
            mensaje.textContent =
                "Guardando ruta...";

            try {

                const respuesta =
                    await fetch(
                        `${API_URL}/rutas/`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`
                            },

                            body: JSON.stringify({

                                nombre:
                                    nombre,

                                repartidor_id:
                                    Number(
                                        repartidor_id
                                    )

                            })
                        }
                    );

                const resultado =
                    await respuesta.json();

                console.log(
                    "Respuesta API:",
                    resultado
                );

                if (!respuesta.ok) {

                    mensaje.style.color =
                        "red";

                    mensaje.textContent =
                        resultado.detail ||
                        "No se pudo crear la ruta";

                    return;
                }

                mensaje.style.color =
                    "green";

                mensaje.textContent =
                    "Ruta creada correctamente";

                formularioRuta.reset();

                setTimeout(
                    function () {

                        cerrarFormularioRuta();

                        obtenerRutas();

                        mensaje.textContent =
                            "";

                        mensaje.style.color =
                            "";

                    },
                    1000
                );

            } catch (error) {

                console.error(
                    "Error al crear ruta:",
                    error
                );

                mensaje.style.color =
                    "red";

                mensaje.textContent =
                    "No se pudo conectar con el servidor";
            }

        }
    );

}

// ==========================================
// OBTENER Y MOSTRAR RUTAS
// ==========================================

async function obtenerRutas() {

    const token =
        localStorage.getItem("token");

    const tabla =
        document.getElementById(
            "tabla-rutas"
        );

    if (!tabla) {
        return;
    }

    try {

        const respuesta =
            await fetch(
                `${API_URL}/rutas/`,
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const rutas =
            await respuesta.json();

        if (!respuesta.ok) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="4">
                        No se pudieron cargar las rutas.
                    </td>
                </tr>
            `;

            console.error(
                "Error al obtener rutas:",
                rutas
            );

            return;
        }

        if (rutas.length === 0) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="4">
                        No hay rutas registradas.
                    </td>
                </tr>
            `;

            return;
        }

        tabla.innerHTML = "";

        rutas.forEach(
            ruta => {

                const fila =
                    document.createElement(
                        "tr"
                    );

                fila.innerHTML = `

                    <td>
                        ${ruta.id}
                    </td>

                    <td>
                        ${ruta.nombre}
                    </td>

                   <td>
                   ${obtenerNombreRepartidor(ruta.repartidor_id)}
                   </td>

                    <td>
                        <button
                        type="button"
                        class="btn-secundario"
                        onclick="verRuta(${ruta.id})"
                        >
                          Ver
                          </button>
                    </td>

                `;

                tabla.appendChild(
                    fila
                );
            }
        );

    } catch (error) {

        console.error(
            "Error al cargar rutas:",
            error
        );

        tabla.innerHTML = `
            <tr>
                <td colspan="4">
                    No se pudo conectar con el servidor.
                </td>
            </tr>
        `;
    }
}
async function cargarRutasAsignacion() {

    const token =
        localStorage.getItem("token");

    const select =
        document.getElementById(
            "asignacion-ruta"
        );

    if (!select) {
        return;
    }

    try {

        const respuesta =
            await fetch(
                `${API_URL}/rutas/`,
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const rutas =
            await respuesta.json();

        if (!respuesta.ok) {

            console.error(
                "No se pudieron cargar las rutas:",
                rutas
            );

            return;
        }

        select.innerHTML = `
            <option value="">
                Selecciona una ruta
            </option>
        `;

        rutas.forEach(
            ruta => {

                const opcion =
                    document.createElement(
                        "option"
                    );

                opcion.value =
                    ruta.id;

                opcion.textContent =
                    ruta.nombre;

                select.appendChild(
                    opcion
                );
            }
        );

    } catch (error) {

        console.error(
            "Error al cargar rutas:",
            error
        );
    }
}

function obtenerNombreRepartidor(repartidorId) {

    const select =
        document.getElementById(
            "nueva-ruta-repartidor"
        );

    if (!select) {
        return `Repartidor #${repartidorId}`;
    }

    const opcion =
        select.querySelector(
            `option[value="${repartidorId}"]`
        );

    if (opcion) {
        return opcion.textContent;
    }

    return `Repartidor #${repartidorId}`;
}


async function cargarPaquetesAsignacion() {

    const token =
        localStorage.getItem("token");

    const select =
        document.getElementById(
            "asignacion-paquete"
        );

    if (!select) {
        return;
    }

    try {

        const respuesta =
            await fetch(
                `${API_URL}/paquetes/`,
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const paquetes =
            await respuesta.json();

        if (!respuesta.ok) {

            console.error(
                "No se pudieron cargar los paquetes:",
                paquetes
            );

            return;
        }

        select.innerHTML = `
            <option value="">
                Selecciona un paquete
            </option>
        `;

        paquetes.forEach(
            paquete => {

                const opcion =
                    document.createElement(
                        "option"
                    );

                opcion.value =
                    paquete.id;

                opcion.textContent =
                    `${paquete.numero_guia} - ${paquete.destinatario}`;

                select.appendChild(
                    opcion
                );
            }
        );

    } catch (error) {

        console.error(
            "Error al cargar paquetes:",
            error
        );
    }
}


// ==========================================
// ASIGNAR PAQUETE A RUTA
// ==========================================

const formularioAsignacionRuta =
    document.getElementById(
        "formulario-asignacion-ruta"
    );

if (formularioAsignacionRuta) {

    formularioAsignacionRuta.addEventListener(
        "submit",
        async function (evento) {

            evento.preventDefault();

            const token =
                localStorage.getItem("token");

            const ruta_id =
                document.getElementById(
                    "asignacion-ruta"
                ).value;

            const paquete_id =
                document.getElementById(
                    "asignacion-paquete"
                ).value;

            const mensaje =
                document.getElementById(
                    "mensaje-asignacion-ruta"
                );

            mensaje.style.color = "";
            mensaje.textContent =
                "Asignando paquete...";

            try {

                const respuesta =
                    await fetch(
                        `${API_URL}/rutas/asignar-paquete`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`
                            },

                            body: JSON.stringify({

                                paquete_id:
                                    Number(
                                        paquete_id
                                    ),

                                ruta_id:
                                    Number(
                                        ruta_id
                                    )

                            })
                        }
                    );

                const resultado =
                    await respuesta.json();

                console.log(
                    "Respuesta API:",
                    resultado
                );

                if (!respuesta.ok) {

                    mensaje.style.color =
                        "red";

                    mensaje.textContent =
                        resultado.detail ||
                        "No se pudo asignar el paquete";

                    return;
                }

                mensaje.style.color =
                    "green";

                mensaje.textContent =
                    "Paquete asignado correctamente";

                formularioAsignacionRuta.reset();

                setTimeout(
                    function () {

                        mensaje.textContent =
                            "";

                        mensaje.style.color =
                            "";

                    },
                    1500
                );

            } catch (error) {

                console.error(
                    "Error al asignar paquete:",
                    error
                );

                mensaje.style.color =
                    "red";

                mensaje.textContent =
                    "No se pudo conectar con el servidor";
            }

        }
    );

}


// ==========================================
// CARGAR PAQUETES ASIGNADOS A RUTAS
// ==========================================

async function obtenerAsignacionesRuta() {

    const token =
        localStorage.getItem("token");

    const tabla =
        document.getElementById(
            "tabla-asignaciones"
        );

    if (!tabla) {
        return;
    }

    try {

        const respuesta =
            await fetch(
                `${API_URL}/rutas/asignaciones`,
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const asignaciones =
            await respuesta.json();

        if (!respuesta.ok) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="3">
                        No se pudieron cargar las asignaciones.
                    </td>
                </tr>
            `;

            return;
        }

        if (asignaciones.length === 0) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="3">
                        No hay paquetes asignados.
                    </td>
                </tr>
            `;

            return;
        }

        tabla.innerHTML = "";

        for (
            const asignacion
            of asignaciones
        ) {

            const respuestaPaquete =
                await fetch(
                    `${API_URL}/paquetes/${asignacion.paquete_id}`,
                    {
                        method: "GET",
                        headers: {
                            "Authorization":
                                `Bearer ${token}`
                        }
                    }
                );

            const paquete =
                await respuestaPaquete.json();

            const respuestaRuta =
                await fetch(
                    `${API_URL}/rutas/${asignacion.ruta_id}`,
                    {
                        method: "GET",
                        headers: {
                            "Authorization":
                                `Bearer ${token}`
                        }
                    }
                );

            const ruta =
                await respuestaRuta.json();

            const fila =
                document.createElement(
                    "tr"
                );

            fila.innerHTML = `

                <td>
                    ${asignacion.id}
                </td>

                <td>
                    ${paquete.numero_guia}
                </td>

                <td>
                    ${ruta.nombre}
                </td>

            `;

            tabla.appendChild(
                fila
            );
        }

    } catch (error) {

        console.error(
            "Error al cargar asignaciones:",
            error
        );

        tabla.innerHTML = `
            <tr>
                <td colspan="3">
                    No se pudo conectar con el servidor.
                </td>
            </tr>
        `;
    }
}

// ==========================================
// CARGAR RUTAS AL ABRIR LA PÁGINA
// ==========================================
if (
    window.location.pathname.endsWith(
        "rutas.html"
    )
) {

    obtenerRepartidoresRuta()
        .then(
            function () {

                return cargarRutasAsignacion();

            }
        )
        .then(
            function () {

                return cargarPaquetesAsignacion();

            }
        )
        .then(
            function () {

                return obtenerAsignacionesRuta();

            }
        )
        .then(
            function () {

                obtenerRutas();

            }
        );
}

// ==========================================
// MAPA DE SEGUIMIENTO
// ==========================================

// ==========================================
// MAPA DE SEGUIMIENTO
// ==========================================

let mapaSeguimiento = null;
let marcadoresRepartidores = [];

async function cargarMapaSeguimiento() {

    const mapaElemento =
        document.getElementById("mapa");

    if (!mapaElemento) {
        return;
    }

    const token =
        localStorage.getItem("token");


    // Crear mapa
    mapaSeguimiento =
        L.map("mapa").setView(
            [13.6929, -89.2182],
            13
        );


    // Capa del mapa
    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(mapaSeguimiento);


    try {

        // ==========================================
        // OBTENER UBICACIONES
        // ==========================================

        const respuestaUbicaciones =
            await fetch(
                `${API_URL}/ubicaciones/`,
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const ubicaciones =
            await respuestaUbicaciones.json();


        if (!respuestaUbicaciones.ok) {

            console.error(
                "No se pudieron obtener las ubicaciones:",
                ubicaciones
            );

            return;
        }


        // ==========================================
        // OBTENER USUARIOS
        // ==========================================

        const respuestaUsuarios =
            await fetch(
                `${API_URL}/usuarios/`,
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const usuarios =
            await respuestaUsuarios.json();


        if (!respuestaUsuarios.ok) {

            console.error(
                "No se pudieron obtener los usuarios:",
                usuarios
            );

            return;
        }


        // ==========================================
        // ELIMINAR MARCADORES ANTERIORES
        // ==========================================

        marcadoresRepartidores.forEach(
            marcador => {

                mapaSeguimiento.removeLayer(
                    marcador
                );

            }
        );

        marcadoresRepartidores = [];


        // ==========================================
        // CREAR MARCADORES
        // ==========================================

        ubicaciones.forEach(
            ubicacion => {

                const repartidor =
                    usuarios.find(
                        usuario =>
                            usuario.id ===
                            ubicacion.repartidor_id
                    );


                const nombreRepartidor =
                    repartidor
                        ? repartidor.nombre
                        : `Repartidor #${ubicacion.repartidor_id}`;


                const marcador =
                    L.marker(
                        [
                            ubicacion.latitud,
                            ubicacion.longitud
                        ]
                    )
                    .addTo(mapaSeguimiento);


                marcador.bindPopup(`
                    <strong>
                        ${nombreRepartidor}
                    </strong>

                    <br>

                    Repartidor

                    <br><br>

                    <strong>
                        Última ubicación:
                    </strong>

                    <br>

                    ${ubicacion.fecha_hora}

                    <br><br>

                    <strong>
                        Coordenadas:
                    </strong>

                    <br>

                    ${ubicacion.latitud},
                    ${ubicacion.longitud}
                `);


                marcadoresRepartidores.push(
                    marcador
                );

            }
        );


        // ==========================================
        // CENTRAR MAPA
        // ==========================================

        if (ubicaciones.length > 0) {

            mapaSeguimiento.setView(
                [
                    ubicaciones[0].latitud,
                    ubicaciones[0].longitud
                ],
                14
            );

        }


    } catch (error) {

        console.error(
            "Error al cargar el mapa:",
            error
        );

    }

}


// ==========================================
// CARGAR MAPA EN SEGUIMIENTO
// ==========================================

if (
    window.location.pathname.endsWith(
        "seguimiento.html"
    )
) {

    cargarMapaSeguimiento();

    cargarTablaSeguimiento();

    setInterval(
        function () {

            cargarMapaSeguimiento();

            cargarTablaSeguimiento();

        },
        30000
    );

}

// ==========================================
// TABLA DE REPARTIDORES
// ==========================================
let repartidoresSeguimiento = [];
let ubicacionesSeguimiento = [];

async function cargarTablaSeguimiento() {

    const tabla =
        document.getElementById(
            "tabla-seguimiento"
        );

    if (!tabla) {
        return;
    }

    const token =
        localStorage.getItem("token");

    try {

        // ==========================================
        // OBTENER UBICACIONES
        // ==========================================

        const respuestaUbicaciones =
            await fetch(
                `${API_URL}/ubicaciones/`,
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const ubicaciones =
            await respuestaUbicaciones.json();

            ubicacionesSeguimiento = ubicaciones;

        if (!respuestaUbicaciones.ok) {

            console.error(
                "Error al obtener ubicaciones:",
                ubicaciones
            );

            return;
        }


        // ==========================================
        // OBTENER USUARIOS
        // ==========================================

        const respuestaUsuarios =
            await fetch(
                `${API_URL}/usuarios/`,
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const usuarios =
            await respuestaUsuarios.json();

        if (!respuestaUsuarios.ok) {

            console.error(
                "Error al obtener usuarios:",
                usuarios
            );

            return;
        }


        // ==========================================
        // SOLO REPARTIDORES ACTIVOS
        // ==========================================

        const repartidores =
            usuarios.filter(
                usuario =>
                    usuario.rol_id === 3 &&
                    usuario.activo === true
            );


        // ==========================================
        // LIMPIAR TABLA
        // ==========================================

        tabla.innerHTML = "";


        if (repartidores.length === 0) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="4">
                        No hay repartidores activos registrados.
                    </td>
                </tr>
            `;

            return;
        }


        // ==========================================
        // CREAR FILAS
        // ==========================================

            mostrarRepartidoresSeguimiento(repartidores);


    } catch (error) {

        console.error(
            "Error al cargar la tabla de seguimiento:",
            error
        );

        tabla.innerHTML = `
            <tr>
                <td colspan="4">
                    No se pudo conectar con el servidor.
                </td>
            </tr>
        `;

    }

}

// ==========================================
// FILTRO DE REPARTIDORES
// ==========================================

function filtrarRepartidoresSeguimiento() {

    const buscador =
        document.getElementById(
            "buscar-repartidor"
        );

    if (!buscador) {
        return;
    }

    const texto =
        buscador.value
            .toLowerCase()
            .trim();

    const repartidoresFiltrados =
        repartidoresSeguimiento.filter(
            repartidor =>
                repartidor.nombre
                    .toLowerCase()
                    .includes(texto)
        );

    mostrarRepartidoresSeguimiento(
        repartidoresFiltrados
    );
}


// ==========================================
// MOSTRAR REPARTIDORES EN TABLA
// ==========================================

function mostrarRepartidoresSeguimiento(
    repartidores
) {

    const tabla =
        document.getElementById(
            "tabla-seguimiento"
        );

    if (!tabla) {
        return;
    }

    tabla.innerHTML = "";

    if (repartidores.length === 0) {

        tabla.innerHTML = `
            <tr>
                <td colspan="4">
                    No se encontraron repartidores.
                </td>
            </tr>
        `;

        return;
    }


    repartidores.forEach(
        repartidor => {

            const ubicacion =
                ubicacionesSeguimiento.find(
                    ubicacion =>
                        ubicacion.repartidor_id ===
                        repartidor.id
                );


            const fila =
                document.createElement("tr");


            if (ubicacion) {

                fila.innerHTML = `

                    <td>
                        ${repartidor.id}
                    </td>

                    <td>
                        ${repartidor.nombre}
                    </td>

                    <td>
                        <span
                            class="estado-paquete estado-en-ruta"
                        >
                            En ruta
                        </span>
                    </td>

                    <td>
                        ${ubicacion.latitud},
                        ${ubicacion.longitud}
                    </td>

                `;

            } else {

                fila.innerHTML = `

                    <td>
                        ${repartidor.id}
                    </td>

                    <td>
                        ${repartidor.nombre}
                    </td>

                    <td>
                        <span
                            class="estado-paquete estado-pendiente"
                        >
                            Sin ubicación
                        </span>
                    </td>

                    <td>
                        Sin ubicación registrada
                    </td>

                `;

            }


            tabla.appendChild(
                fila
            );

        }
    );

}

// ==========================================
// BUSCADOR DE REPARTIDORES
// ==========================================

const buscadorRepartidor =
    document.getElementById(
        "buscar-repartidor"
    );

if (buscadorRepartidor) {

    buscadorRepartidor.addEventListener(
        "input",
        filtrarRepartidoresSeguimiento
    );

}

// ==========================================
// RASTREO PÚBLICO DE PAQUETES
// ==========================================
// ==========================================
// RASTREO PÚBLICO DE PAQUETES
// ==========================================

const formularioRastreo =
    document.getElementById("formulario-rastreo");

if (formularioRastreo) {

    formularioRastreo.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const numeroGuia =
                document.getElementById(
                    "numero-guia-rastreo"
                ).value.trim();

            const mensaje =
                document.getElementById(
                    "mensaje-rastreo"
                );

            const resultado =
                document.getElementById(
                    "resultado-rastreo"
                );


            if (!numeroGuia) {

                mensaje.textContent =
                    "Ingresa un número de guía.";

                resultado.style.display = "none";

                return;
            }


            mensaje.textContent =
                "Consultando paquete...";

            resultado.style.display = "none";


            try {

                const respuesta =
                    await fetch(
                        `${API_URL}/seguimiento/${encodeURIComponent(numeroGuia)}`
                    );


                const datos =
                    await respuesta.json();


                if (!respuesta.ok) {

                    mensaje.textContent =
                        datos.detail ||
                        "Número de guía no encontrado.";

                    return;
                }


                // ==========================================
                // MOSTRAR INFORMACIÓN DEL PAQUETE
                // ==========================================

                document.getElementById(
                    "rastreo-guia"
                ).textContent =
                    datos.numero_guia || "-";


                document.getElementById(
                    "rastreo-remitente"
                ).textContent =
                    datos.remitente || "-";


                document.getElementById(
                    "rastreo-destinatario"
                ).textContent =
                    datos.destinatario || "-";


                document.getElementById(
                    "rastreo-telefono"
                ).textContent =
                    datos.telefono_destinatario || "-";


                document.getElementById(
                    "rastreo-direccion"
                ).textContent =
                    datos.direccion_entrega || "-";


                document.getElementById(
                    "rastreo-estado"
                ).textContent =
                    datos.estado || "-";


                document.getElementById(
                    "rastreo-pago"
                ).textContent =
                    datos.estado_pago || "-";


                mensaje.textContent =
                    "Paquete encontrado correctamente.";


                resultado.style.display =
                    "block";


            } catch (error) {

                console.error(
                    "Error al consultar el paquete:",
                    error
                );

                mensaje.textContent =
                    "No se pudo conectar con el servidor.";

                resultado.style.display =
                    "none";
            }

        }
    );

}


// ==========================================
// REPORTES Y CONTROL
// ==========================================

async function cargarReportes() {

    const tabla =
        document.getElementById("tabla-reportes");

    if (!tabla) {
        return;
    }

    const token =
        localStorage.getItem("token");

    try {

        const respuesta =
            await fetch(
                `${API_URL}/paquetes/`,
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const paquetes =
            await respuesta.json();


        if (!respuesta.ok) {

            console.error(
                "Error al obtener paquetes:",
                paquetes
            );

            tabla.innerHTML = `
                <tr>
                    <td colspan="5">
                        No se pudo obtener la información.
                    </td>
                </tr>
            `;

            return;
        }


        // ==========================================
        // CALCULAR TOTALES
        // ==========================================

        const total =
            paquetes.length;


        const enAlmacen =
            paquetes.filter(
                paquete =>
                    paquete.estado === "En almacén"
            ).length;


        const enRuta =
            paquetes.filter(
                paquete =>
                    paquete.estado === "En ruta"
            ).length;


        const entregados =
            paquetes.filter(
                paquete =>
                    paquete.estado === "Entregado"
            ).length;


        const pagados =
            paquetes.filter(
                paquete =>
                    paquete.estado_pago === "Pagado"
            ).length;


        const pendientes =
            paquetes.filter(
                paquete =>
                    paquete.estado_pago === "Pendiente"
            ).length;


        // ==========================================
        // MOSTRAR TOTALES
        // ==========================================

        document.getElementById(
            "reporte-total"
        ).textContent = total;


        document.getElementById(
            "reporte-almacen"
        ).textContent = enAlmacen;


        document.getElementById(
            "reporte-ruta"
        ).textContent = enRuta;


        document.getElementById(
            "reporte-entregados"
        ).textContent = entregados;


        document.getElementById(
            "reporte-pagados"
        ).textContent = pagados;


        document.getElementById(
            "reporte-pendientes"
        ).textContent = pendientes;


        // ==========================================
        // MOSTRAR TABLA
        // ==========================================

        tabla.innerHTML = "";


        if (paquetes.length === 0) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="5">
                        No hay paquetes registrados.
                    </td>
                </tr>
            `;

            return;
        }


        paquetes.forEach(
            paquete => {

                const fila =
                    document.createElement("tr");


                fila.innerHTML = `

                    <td>
                        ${paquete.numero_guia}
                    </td>

                    <td>
                        ${paquete.remitente}
                    </td>

                    <td>
                        ${paquete.destinatario}
                    </td>

                    <td>
                        <span class="estado-paquete estado-${paquete.estado.toLowerCase().replace(" ", "-")}">
                            ${paquete.estado}
                        </span>
                    </td>

                    <td>
                        ${paquete.estado_pago}
                    </td>

                `;


                tabla.appendChild(fila);

            }
        );


    } catch (error) {

        console.error(
            "Error al cargar reportes:",
            error
        );

        tabla.innerHTML = `
            <tr>
                <td colspan="5">
                    No se pudo conectar con el servidor.
                </td>
            </tr>
        `;

    }

}


if (
    window.location.pathname.endsWith(
        "reportes.html"
    )
) {

    cargarReportes();

}


// ==========================================
// EVENTOS DE FILTROS
// ==========================================

const buscadorUsuario =
    document.getElementById(
        "buscar-usuario"
    );


const filtroRol =
    document.getElementById(
        "filtro-rol"
    );


if (buscadorUsuario) {

    buscadorUsuario.addEventListener(
        "input",
        aplicarFiltrosUsuarios
    );

}


if (filtroRol) {

    filtroRol.addEventListener(
        "change",
        aplicarFiltrosUsuarios
    );

}

// ======================================================
// PÁGINA DE CLIENTES
// ======================================================

let clientesPagina = [];


// ======================================================
// CARGAR CLIENTES EN LA PÁGINA
// ======================================================

async function cargarClientesPagina() {

    const tabla =
        document.getElementById(
            "tabla-clientes"
        );

    if (!tabla) {
        return;
    }


    const token =
        localStorage.getItem(
            "token"
        );


    try {

        tabla.innerHTML = `
            <tr>
                <td colspan="5">
                    Cargando clientes...
                </td>
            </tr>
        `;


        const respuesta =
            await fetch(
                `${API_URL}/clientes/`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const clientes =
            await respuesta.json();


        if (!respuesta.ok) {

            console.error(
                "Error al obtener clientes:",
                clientes
            );

            tabla.innerHTML = `
                <tr>
                    <td colspan="5">
                        No se pudieron cargar los clientes.
                    </td>
                </tr>
            `;

            return;
        }


        clientesPagina =
            clientes;


        mostrarClientesPagina(
            clientesPagina
        );


    } catch (error) {

        console.error(
            "Error al cargar clientes:",
            error
        );


        tabla.innerHTML = `
            <tr>
                <td colspan="5">
                    Error de conexión con el servidor.
                </td>
            </tr>
        `;

    }

}


// ======================================================
// MOSTRAR CLIENTES EN LA TABLA
// ======================================================

function mostrarClientesPagina(
    clientes
) {

    const tabla =
        document.getElementById(
            "tabla-clientes"
        );


    if (!tabla) {
        return;
    }


    if (clientes.length === 0) {

        tabla.innerHTML = `
            <tr>
                <td colspan="5">
                    No hay clientes registrados.
                </td>
            </tr>
        `;

        return;
    }


    tabla.innerHTML =
        clientes.map(
            cliente => {

                return `
                    <tr>

                        <td>
                            ${cliente.id}
                        </td>

                        <td>
                            ${cliente.nombre}
                        </td>

                        <td>
                            ${cliente.telefono}
                        </td>

                        <td>
                            ${cliente.direccion}
                        </td>

                        <td>

                            <button
                                type="button"
                                class="btn-tabla"
                                onclick="editarCliente(${cliente.id})"
                            >
                                Editar
                            </button>

                        </td>

                    </tr>
                `;

            }
        ).join("");

}


// ======================================================
// BUSCAR CLIENTES
// ======================================================

function buscarClientesPagina() {

    const buscador =
        document.getElementById(
            "buscar-cliente"
        );


    if (!buscador) {
        return;
    }


    const texto =
        buscador.value
            .toLowerCase()
            .trim();


    const clientesFiltrados =
        clientesPagina.filter(
            cliente => {

                const nombre =
                    (
                        cliente.nombre ||
                        ""
                    )
                    .toLowerCase();


                const telefono =
                    (
                        cliente.telefono ||
                        ""
                    )
                    .toLowerCase();


                const direccion =
                    (
                        cliente.direccion ||
                        ""
                    )
                    .toLowerCase();


                return (
                    nombre.includes(texto) ||
                    telefono.includes(texto) ||
                    direccion.includes(texto)
                );

            }
        );


    mostrarClientesPagina(
        clientesFiltrados
    );

}


// ======================================================
// INICIALIZAR PÁGINA DE CLIENTES
// ======================================================

if (
    window.location.pathname.endsWith(
        "clientes.html"
    )
) {

    cargarClientesPagina();


    const buscador =
        document.getElementById(
            "buscar-cliente"
        );


    if (buscador) {

        buscador.addEventListener(
            "input",
            buscarClientesPagina
        );

    }

}

// ======================================================
// EDITAR CLIENTE
// ======================================================

window.editarCliente = async function(clienteId) {

    console.log(
        "Editando cliente:",
        clienteId
    );


    const cliente =
        clientesPagina.find(
            cliente =>
                Number(cliente.id) ===
                Number(clienteId)
        );


    if (!cliente) {

        console.error(
            "Cliente no encontrado:",
            clienteId
        );

        return;

    }


    const id =
        document.getElementById(
            "editar-cliente-id"
        );

    const nombre =
        document.getElementById(
            "editar-cliente-nombre"
        );

    const telefono =
        document.getElementById(
            "editar-cliente-telefono"
        );

    const direccion =
        document.getElementById(
            "editar-cliente-direccion"
        );

    const mensaje =
        document.getElementById(
            "mensaje-editar-cliente"
        );


    if (id) {
        id.value =
            cliente.id;
    }


    if (nombre) {
        nombre.value =
            cliente.nombre || "";
    }


    if (telefono) {
        telefono.value =
            cliente.telefono || "";
    }


    if (direccion) {
        direccion.value =
            cliente.direccion || "";
    }


    if (mensaje) {

        mensaje.textContent =
            "";

        mensaje.style.color =
            "";

    }


    const modal =
        document.getElementById(
            "modal-editar-cliente"
        );


    if (modal) {

        modal.style.display =
            "flex";

    }

};


// ======================================================
// CERRAR EDITAR CLIENTE
// ======================================================

window.cerrarFormularioEditarCliente =
    function() {

        const modal =
            document.getElementById(
                "modal-editar-cliente"
            );


        if (modal) {

            modal.style.display =
                "none";

        }

    };


// ======================================================
// GUARDAR CAMBIOS DEL CLIENTE
// ======================================================

const formularioEditarCliente =
    document.getElementById(
        "formulario-editar-cliente"
    );


if (formularioEditarCliente) {

    formularioEditarCliente.addEventListener(
        "submit",
        async function(evento) {

            evento.preventDefault();


            const clienteId =
                document.getElementById(
                    "editar-cliente-id"
                ).value;


            const nombre =
                document.getElementById(
                    "editar-cliente-nombre"
                ).value.trim();


            const telefono =
                document.getElementById(
                    "editar-cliente-telefono"
                ).value.trim();


            const direccion =
                document.getElementById(
                    "editar-cliente-direccion"
                ).value.trim();


            const mensaje =
                document.getElementById(
                    "mensaje-editar-cliente"
                );


            if (
                !nombre ||
                !telefono ||
                !direccion
            ) {

                mensaje.style.color =
                    "red";

                mensaje.textContent =
                    "Completa todos los campos.";

                return;

            }


            const token =
                localStorage.getItem(
                    "token"
                );


            mensaje.textContent =
                "Guardando cambios...";


            try {

                const respuesta =
                    await fetch(
                        `${API_URL}/clientes/${clienteId}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`
                            },

                            body: JSON.stringify({

                                nombre:
                                    nombre,

                                telefono:
                                    telefono,

                                direccion:
                                    direccion

                            })
                        }
                    );


                const resultado =
                    await respuesta.json();


                if (!respuesta.ok) {

                    mensaje.style.color =
                        "red";

                    mensaje.textContent =
                        resultado.detail ||
                        "No se pudo actualizar el cliente.";

                    return;

                }


                mensaje.style.color =
                    "green";

                mensaje.textContent =
                    "Cliente actualizado correctamente.";


                // Actualizar tabla

                await cargarClientesPagina();


                // Actualizar clientes utilizados
                // por el módulo de paquetes

                if (
                    typeof cargarClientes ===
                    "function"
                ) {

                    await cargarClientes();

                }


                setTimeout(
                    function() {

                        cerrarFormularioEditarCliente();

                        mensaje.textContent =
                            "";

                        mensaje.style.color =
                            "";

                    },
                    700
                );


            } catch (error) {

                console.error(
                    "Error al actualizar cliente:",
                    error
                );


                mensaje.style.color =
                    "red";

                mensaje.textContent =
                    "No se pudo conectar con el servidor.";

            }

        }
    );

}



window.cerrarSesion = function() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
};