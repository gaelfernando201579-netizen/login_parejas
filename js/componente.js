/* =====================  TOAST  ===================== */

const ICONOS = { success: '✓', error: '✕', info: 'i', warning: '!' };

// Busca el contenedor de una esquina; si no existe, lo crea
function obtenerContenedor(posicion) {
    let contenedor = document.querySelector(`.cv-toast-container[data-pos="${posicion}"]`);
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.className = 'cv-toast-container';
        contenedor.dataset.pos = posicion;
        document.body.appendChild(contenedor);
    }
    return contenedor;
}

class Toast {
    static show({ message = '', title = '', type = 'info', duration = 4000, position = 'top-right' } = {}) {
        const contenedor = obtenerContenedor(position);

        // 1. Crear el HTML del toast
        const toast = document.createElement('div');
        toast.className = 'cv-toast cv-toast-' + type;
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
        toast.innerHTML = `
            <span class="cv-toast-icon"></span>
            <div class="cv-toast-body">
                <strong class="cv-toast-title"></strong>
                <span class="cv-toast-message"></span>
            </div>
            <button class="cv-toast-close" aria-label="Cerrar">&times;</button>
            <span class="cv-toast-bar"></span>`;

        // 2. Poner los textos con textContent (así nadie puede inyectar HTML)
        toast.querySelector('.cv-toast-icon').textContent = ICONOS[type];
        toast.querySelector('.cv-toast-title').textContent = title;
        toast.querySelector('.cv-toast-message').textContent = message;

        // 3. Función para cerrar: anima la salida y luego elimina el toast
        const cerrar = () => {
            toast.classList.add('out');
            toast.addEventListener('animationend', () => {
                toast.remove();
                if (!contenedor.children.length) contenedor.remove();
            });
        };

        // 4. La barra de progreso es el temporizador: cuando termina su animación,
        //    se cierra el toast. Al pasar el mouse el CSS pausa la barra, y con ella el cierre.
        const barra = toast.querySelector('.cv-toast-bar');
        barra.style.setProperty('--cv-duracion', duration + 'ms');
        barra.addEventListener('animationend', cerrar);
        toast.querySelector('.cv-toast-close').addEventListener('click', cerrar);

        // 5. Mostrarlo
        contenedor.appendChild(toast);
    }
}

// Atajos: Toast.success('texto'), Toast.error('texto'), etc.
['success', 'error', 'info', 'warning'].forEach(tipo => {
    Toast[tipo] = (message, opciones = {}) => Toast.show({ ...opciones, message, type: tipo });
});


/* =====================  MODAL  ===================== */

class Modal {
    static open({ title = '', content = '', confirmText = 'Aceptar', cancelText = 'Cancelar', onConfirm } = {}) {
        Modal.close(); // solo un modal a la vez

        const fondo = document.createElement('div');
        fondo.className = 'cv-modal-overlay';
        fondo.innerHTML = `
            <div class="cv-modal" role="dialog" aria-modal="true">
                <h3 class="cv-modal-title"></h3>
                <p class="cv-modal-text"></p>
                <div class="cv-modal-actions">
                    <button class="cv-btn cv-btn-ghost" data-accion="cancelar"></button>
                    <button class="cv-btn cv-btn-primary" data-accion="confirmar"></button>
                </div>
            </div>`;

        fondo.querySelector('.cv-modal-title').textContent = title;
        fondo.querySelector('.cv-modal-text').textContent = content;
        fondo.querySelector('[data-accion="cancelar"]').textContent = cancelText;
        fondo.querySelector('[data-accion="confirmar"]').textContent = confirmText;

        // Clic en el fondo o en "cancelar" cierra; "confirmar" cierra y ejecuta la acción
        fondo.addEventListener('click', e => {
            const accion = e.target.dataset.accion;
            if (e.target === fondo || accion === 'cancelar') Modal.close();
            if (accion === 'confirmar') {
                Modal.close();
                if (onConfirm) onConfirm();
            }
        });

        // Tecla Escape cierra
        Modal.alTeclear = e => { if (e.key === 'Escape') Modal.close(); };
        document.addEventListener('keydown', Modal.alTeclear);

        document.body.appendChild(fondo);
        Modal.actual = fondo;
        // Se agrega "open" un instante después para que se vea la animación de entrada
        requestAnimationFrame(() => fondo.classList.add('open'));
    }

    static close() {
        if (!Modal.actual) return;
        const fondo = Modal.actual;
        Modal.actual = null;
        document.removeEventListener('keydown', Modal.alTeclear);
        fondo.classList.remove('open');
        setTimeout(() => fondo.remove(), 300); // espera a que termine la animación
    }
}


/* ============  ACORDEÓN Y PESTAÑAS  ============
   No hace falta escribir JS: basta con usar las clases cv-* en el HTML. */

function alternarAcordeon(cabecera) {
    const item = cabecera.parentElement;
    const acordeon = item.parentElement;

    // Con el atributo data-single, al abrir uno se cierran los demás
    if (acordeon.hasAttribute('data-single')) {
        acordeon.querySelectorAll('.cv-acc-item.open').forEach(otro => {
            if (otro !== item) {
                otro.classList.remove('open');
                otro.querySelector('.cv-acc-head').setAttribute('aria-expanded', 'false');
            }
        });
    }
    const abierto = item.classList.toggle('open');
    cabecera.setAttribute('aria-expanded', abierto);
}

function cambiarPestana(boton) {
    const pestanas = boton.closest('.cv-tabs');
    pestanas.querySelectorAll('.cv-tab-btn').forEach(b => b.classList.toggle('active', b === boton));
    pestanas.querySelectorAll('.cv-tab-panel').forEach(p => p.classList.toggle('active', p.id === boton.dataset.tab));
}

// Un solo "oyente" de clics para toda la página
document.addEventListener('click', e => {
    const cabecera = e.target.closest('.cv-acc-head');
    const boton = e.target.closest('.cv-tab-btn');
    if (cabecera) alternarAcordeon(cabecera);
    if (boton) cambiarPestana(boton);
});


/* =====================  TEMA  ===================== */

const Theme = {
    set(nombre) {
        document.documentElement.dataset.theme = nombre;
        try { localStorage.setItem('theme', nombre); } catch (e) {} // recordar la elección
    },
    toggle() {
        const nuevo = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        this.set(nuevo);
        return nuevo;
    },
    init() {
        let guardado = null;
        try { guardado = localStorage.getItem('theme'); } catch (e) {}
        const sistemaOscuro = matchMedia('(prefers-color-scheme: dark)').matches;
        this.set(guardado || (sistemaOscuro ? 'dark' : 'light'));
    }
};
Theme.init();