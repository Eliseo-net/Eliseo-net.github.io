document.addEventListener('DOMContentLoaded', () => {
    console.log('La página se ha cargado completamente. ¡Que empiece la diversión!');

    // Función para reproducir un sonido divertido
    function playChildSound() {
        const audio = new Audio('https://www.soundjay.com/misc/sounds/magic-chime-01.mp3'); // Sonido de campanilla mágica
        audio.play();
    }

    // Lógica para el acordeón de Preguntas y Respuestas
    const accordionButtons = document.querySelectorAll('.accordion-button');

    accordionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const accordionContent = button.nextElementSibling; // El contenido está justo después del botón
            
            // Cierra todos los otros contenidos abiertos
            accordionButtons.forEach(otherButton => {
                if (otherButton !== button && otherButton.classList.contains('active')) {
                    otherButton.classList.remove('active');
                    otherButton.nextElementSibling.classList.remove('active');
                    otherButton.nextElementSibling.style.maxHeight = null; // Restablecer la altura máxima
                }
            });

            // Abre o cierra el contenido actual
            button.classList.toggle('active');
            accordionContent.classList.toggle('active');

            if (accordionContent.classList.contains('active')) {
                // Si se va a abrir, establece la altura para que la transición funcione
                accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
                playChildSound(); // Reproducir sonido al abrir
            } else {
                // Si se va a cerrar, establece la altura a 0
                accordionContent.style.maxHeight = null;
            }
        });
    });

    // --- Lógica de Three.js para el Merge Cube Simulado ---

    let scene, camera, renderer, cube;
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let cubeMaterial; // Para controlar la transparencia del cubo base

    // Grupo para contener los objetos virtuales "proyectados"
    const virtualObjectsGroup = new THREE.Group();

    // Función para crear una manzana simple
    const createApple = () => {
        const appleGroup = new THREE.Group();

        // Cuerpo de la manzana (esfera ligeramente aplastada)
        const bodyGeometry = new THREE.SphereGeometry(0.8, 32, 32);
        const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 }); // Rojo
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.scale.y = 0.9; // Aplanar ligeramente para forma de manzana
        body.position.y = 0.8 * 0.9; // Ajustar posición para que la base esté en y=0
        appleGroup.add(body);

        // Tallo
        const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8);
        const stemMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 }); // Marrón
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = (0.8 * 0.9) + (0.4 / 2); // Posicionar encima de la manzana
        appleGroup.add(stem);

        // Pequeña hoja
        const leafShape = new THREE.Shape();
        leafShape.moveTo(0, 0);
        leafShape.bezierCurveTo(0.1, 0.2, 0.4, 0.2, 0.5, 0);
        leafShape.bezierCurveTo(0.4, -0.2, 0.1, -0.2, 0, 0);
        const leafGeometry = new THREE.ShapeGeometry(leafShape);
        const leafMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22, side: THREE.DoubleSide }); // Verde
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        leaf.scale.set(0.6, 0.6, 0.6);
        leaf.rotation.z = Math.PI / 4; // Inclinar un poco
        leaf.position.set(stem.position.x + 0.1, stem.position.y + 0.1, stem.position.z + 0.1);
        appleGroup.add(leaf);

        appleGroup.scale.set(0.7, 0.7, 0.7); // Escala general
        return appleGroup;
    };

    // Función para crear una flor simple
    const createFlower = () => {
        const flowerGroup = new THREE.Group();
        const petalMaterial = new THREE.MeshBasicMaterial({ color: 0xFF00FF }); // Pétalos magenta
        const centerMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 }); // Centro amarillo
        const stemMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22 }); // Tallo verde

        // Centro de la flor
        const centerGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        flowerGroup.add(center);

        // Pétalos (simples planos)
        const petalShape = new THREE.Shape();
        petalShape.moveTo(0, 0);
        petalShape.quadraticCurveTo(0.2, 0.5, 0, 1);
        petalShape.quadraticCurveTo(-0.2, 0.5, 0, 0);
        const petalGeometry = new THREE.ShapeGeometry(petalShape);

        for (let i = 0; i < 8; i++) {
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            petal.position.set(0, 0, 0); // Posición inicial en el centro
            petal.rotation.z = i * (Math.PI * 2 / 8); // Rotar alrededor del centro
            petal.position.x = 0.4 * Math.cos(petal.rotation.z); // Mover hacia afuera
            petal.position.y = 0.4 * Math.sin(petal.rotation.z);
            petal.scale.set(0.5, 0.5, 0.5); // Escalar pétalos
            flowerGroup.add(petal);
        }

        // Tallo (cilindro)
        const stemHeight = 1.5;
        const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, stemHeight, 8);
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = -stemHeight / 2; // Colocar la base del tallo en y=-stemHeight
        flowerGroup.add(stem);

        // Ajustar la posición vertical de todo el grupo para que la base del tallo esté en y=0
        flowerGroup.position.y = stemHeight / 2; 

        flowerGroup.scale.set(0.7, 0.7, 0.7); // Escalar la flor para que encaje
        return flowerGroup;
    };

    // Función para crear un gusanito
    const createCaterpillar = () => {
        const caterpillarGroup = new THREE.Group();
        const segmentMaterial = new THREE.MeshBasicMaterial({ color: 0x7CFC00 }); // Verde brillante
        const headMaterial = new THREE.MeshBasicMaterial({ color: 0xFF4500 }); // Naranja para la cabeza
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Ojos negros

        const segmentRadius = 0.2;
        const segmentCount = 6;
        const segmentOffset = segmentRadius * 1.5; // Espacio entre segmentos

        for (let i = 0; i < segmentCount; i++) {
            const segment = new THREE.Mesh(new THREE.SphereGeometry(segmentRadius, 16, 16), segmentMaterial);
            segment.position.x = i * segmentOffset - (segmentCount - 1) * segmentOffset / 2; // Centrar el gusanito
            caterpillarGroup.add(segment);
        }

        // Cabeza (un poco más grande y de otro color)
        const headRadius = segmentRadius * 1.2;
        const head = new THREE.Mesh(new THREE.SphereGeometry(headRadius, 16, 16), headMaterial);
        head.position.x = (segmentCount - 1) * segmentOffset / 2 + headRadius; // Posicionar la cabeza al final
        caterpillarGroup.add(head);

        // Ojos
        const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(head.position.x + headRadius * 0.7, headRadius * 0.4, headRadius * 0.4);
        caterpillarGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(head.position.x + headRadius * 0.7, headRadius * 0.4, -headRadius * 0.4);
        caterpillarGroup.add(rightEye);

        // Ajustar la posición vertical de todo el grupo para que descanse en y=0
        caterpillarGroup.position.y = segmentRadius; // Elevar para que la base del gusanito esté en y=0

        caterpillarGroup.scale.set(0.7, 0.7, 0.7); // Escalar el gusanito para que encaje
        caterpillarGroup.rotation.y = Math.PI / 2; // Rotar para que mire hacia adelante
        return caterpillarGroup;
    };


    // Inicializar la escena, cámara y renderizador de Three.js
    function initThreeJS() {
        const canvas = document.getElementById('mergeCubeCanvas');
        if (!canvas) {
            console.error("Canvas 'mergeCubeCanvas' no encontrado.");
            return;
        }

        scene = new THREE.Scene();

        // Configuración de la cámara
        camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        camera.position.z = 5; // Posicionar la cámara hacia atrás para ver el cubo

        // Configuración del renderizador
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);

        // Añadir una fuente de luz para hacer los objetos visibles
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Luz blanca suave
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Luz más brillante desde una dirección
        directionalLight.position.set(1, 1, 1); // Posición de la fuente de luz
        scene.add(directionalLight);

        // Crear el cubo base (representación del Merge Cube)
        const cubeGeometry = new THREE.BoxGeometry(2, 2, 2); // Tamaño del cubo
        cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.1, roughness: 0.7 }); // Gris claro con algo de textura
        cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        scene.add(cube);

        // Añadir objetos virtuales a un grupo y hacerlos invisibles inicialmente
        virtualObjectsGroup.add(createApple()); // Manzana
        virtualObjectsGroup.add(createFlower()); // Flor
        virtualObjectsGroup.add(createCaterpillar()); // Gusanito
        
        virtualObjectsGroup.children.forEach(obj => obj.visible = false); // Ocultar todos los objetos inicialmente
        cube.add(virtualObjectsGroup); // Añadir el grupo al cubo para que roten junto con él

        // Escuchadores de eventos para la rotación del cubo con el ratón
        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('mousemove', onMouseMove);
        // Añadir eventos táctiles para la responsividad móvil
        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('touchend', onTouchEnd);
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });


        // Manejar el redimensionamiento del canvas para mantener la responsividad
        window.addEventListener('resize', onWindowResize);

        // Iniciar el bucle de animación
        animate();
    }

    // Función para manejar el redimensionamiento de la ventana
    function onWindowResize() {
        const canvas = document.getElementById('mergeCubeCanvas');
        if (canvas) {
            camera.aspect = canvas.clientWidth / canvas.clientHeight; // Actualizar la relación de aspecto de la cámara
            camera.updateProjectionMatrix(); // Actualizar la matriz de proyección
            renderer.setSize(canvas.clientWidth, canvas.clientHeight); // Redimensionar el renderizador
        }
    }

    // Manejador de eventos para el botón del ratón presionado
    function onMouseDown(event) {
        isDragging = true;
        previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }

    // Manejador de eventos para el botón del ratón soltado
    function onMouseUp() {
        isDragging = false;
    }

    // Manejador de eventos para el movimiento del ratón (para rotar el cubo)
    function onMouseMove(event) {
        if (!isDragging) return;

        const deltaX = event.clientX - previousMousePosition.x;
        const deltaY = event.clientY - previousMousePosition.y;

        // Rotar el cubo según el movimiento del ratón
        cube.rotation.y += deltaX * 0.01; // Rotar alrededor del eje Y
        cube.rotation.x += deltaY * 0.01; // Rotar alrededor del eje X

        previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }

    // Eventos táctiles para dispositivos móviles
    function onTouchStart(event) {
        if (event.touches.length === 1) {
            isDragging = true;
            previousMousePosition = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
        }
        event.preventDefault(); // Prevenir el desplazamiento mientras se toca el canvas
    }

    function onTouchEnd() {
        isDragging = false;
    }

    function onTouchMove(event) {
        if (!isDragging || event.touches.length !== 1) return;

        const deltaX = event.touches[0].clientX - previousMousePosition.x;
        const deltaY = event.touches[0].clientY - previousMousePosition.y;

        cube.rotation.y += deltaX * 0.01;
        cube.rotation.x += deltaY * 0.01;

        previousMousePosition = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
        event.preventDefault(); // Prevenir el desplazamiento mientras se toca el canvas
    }

    // Bucle de animación para renderizar la escena
    function animate() {
        requestAnimationFrame(animate); // Solicitar el siguiente fotograma
        renderer.render(scene, camera); // Renderizar la escena con la cámara
    }

    // Función para mostrar un objeto virtual específico en el cubo
    function showVirtualObject(type) {
        virtualObjectsGroup.children.forEach(obj => obj.visible = false); // Ocultar todos los objetos virtuales
        playChildSound(); // Reproducir un efecto de sonido

        let objectToShow;
        // La posición Y donde se ubicará la base del objeto virtual sobre el cubo
        const baseOnCubeY = 1.0; // La cara superior del cubo está en Y=1.0 (el cubo tiene 2 unidades de alto, de -1 a 1)
        const marginAboveCube = 0.1; // Pequeño margen para que no toque la superficie del cubo

        // Ajustar la transparencia del cubo según si se muestra un objeto virtual
        if (type === 'clear') {
            cubeMaterial.opacity = 1.0; // Hacer el cubo opaco
            cubeMaterial.transparent = false;
        } else {
            cubeMaterial.opacity = 0.3; // Hacer el cubo semi-transparente para mostrar mejor el objeto virtual
            cubeMaterial.transparent = true;
        }
        cubeMaterial.needsUpdate = true; // Importante: notificar a Three.js que las propiedades del material cambiaron

        switch (type) {
            case 'apple': // Ahora es la manzana
                objectToShow = virtualObjectsGroup.children[0];
                objectToShow.position.set(0, baseOnCubeY + marginAboveCube, 0); 
                break;
            case 'flower':
                objectToShow = virtualObjectsGroup.children[1];
                objectToShow.position.set(0, baseOnCubeY + marginAboveCube, 0); 
                break;
            case 'caterpillar': 
                objectToShow = virtualObjectsGroup.children[2];
                objectToShow.position.set(0, baseOnCubeY + marginAboveCube, 0); 
                break;
            case 'clear':
                // Todos los objetos ya están ocultos por el bucle inicial
                break;
        }

        if (objectToShow) {
            objectToShow.visible = true; // Hacer visible el objeto seleccionado
        }
    }

    // --- Lógica para el cuadro de mensaje emergente (modal) ---
    const messageBoxOverlay = document.getElementById('messageBoxOverlay');
    const messageBoxTitle = document.getElementById('messageBoxTitle');
    const messageBoxContent = document.getElementById('messageBoxContent');
    const messageBoxCloseBtn = document.getElementById('messageBoxCloseBtn');

    function showMessageBox(title, message) {
        messageBoxTitle.textContent = title;
        messageBoxContent.textContent = message;
        messageBoxOverlay.classList.add('active');
        playChildSound(); // Reproducir sonido cuando aparece el cuadro de mensaje
    }

    messageBoxCloseBtn.addEventListener('click', () => {
        messageBoxOverlay.classList.remove('active');
    });

    // --- Memorama 4x4 ---
    const memoryGameGrid = document.getElementById('memoryGame4x4Grid'); // Cambiado de 5x5 a 4x4
    const memoryGameMessage = document.getElementById('memoryGame4x4Message'); // Cambiado de 5x5 a 4x4
    const memoryRestartBtn = document.getElementById('memory4x4RestartBtn'); // Cambiado de 5x5 a 4x4

    let cards = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let lockBoard = false;

    // Nuevos iconos para el tema de jardín (8 pares)
    const memoryIcons = ['🦋', '🐞', '🌻', '🌳', '🐝', '🌼', '🦊', '🦉']; 
    
    function initMemoryGame4x4() { // Cambiado de 5x5 a 4x4
        cards = [...memoryIcons, ...memoryIcons]; // Duplicar iconos para 8 pares = 16 cartas
        shuffleArray(cards);
        memoryGameGrid.innerHTML = ''; // Limpiar grid anterior
        memoryGameMessage.textContent = '¡Encuentra los pares! 🌱';
        matchedPairs = 0;
        lockBoard = false;
        flippedCards = [];

        // Crear las 16 cartas para el 4x4
        for (let i = 0; i < 16; i++) { // Bucle de 16 cartas
            const icon = cards[i]; // Usar las cartas mezcladas
            const cardElement = document.createElement('div');
            cardElement.classList.add('memory-card'); // Clase genérica para las tarjetas
            cardElement.dataset.index = i;
            cardElement.dataset.icon = icon;

            const frontFace = document.createElement('div');
            frontFace.classList.add('front-face');
            frontFace.textContent = icon;

            const backFace = document.createElement('div');
            backFace.classList.add('back-face');
            backFace.innerHTML = '❓'; // Icono de pregunta

            cardElement.appendChild(frontFace);
            cardElement.appendChild(backFace);
            cardElement.addEventListener('click', flipCard); // Usar flipCard
            memoryGameGrid.appendChild(cardElement);
        }

        memoryRestartBtn.onclick = initMemoryGame4x4; // Cambiado a 4x4
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function flipCard(event) { // Usar flipCard
        if (lockBoard) return;
        const clickedCard = event.currentTarget;
        if (clickedCard.classList.contains('flipped') || clickedCard.classList.contains('matched')) return;

        clickedCard.classList.add('flipped');
        playChildSound(); // Sonido al voltear la carta
        flippedCards.push(clickedCard);

        if (flippedCards.length === 2) {
            lockBoard = true;
            checkForMatch(); // Usar checkForMatch
        }
    }

    function checkForMatch() { // Usar checkForMatch
        const [card1, card2] = flippedCards;
        const isMatch = card1.dataset.icon === card2.dataset.icon;

        if (isMatch) {
            disableCards(); // Usar disableCards
            matchedPairs++;
            memoryGameMessage.textContent = '¡Pareja encontrada! 🎉';
            if (matchedPairs === memoryIcons.length) { // Total de pares esperados
                showMessageBox('¡Felicidades!', '¡Has encontrado todas las parejas! Eres un campeón de la memoria. 🏆');
            }
        } else {
            unflipCards(); // Usar unflipCards
            memoryGameMessage.textContent = '¡Intenta de nuevo! 🤔';
        }
    }

    function disableCards() { // Usar disableCards
        flippedCards.forEach(card => {
            card.removeEventListener('click', flipCard);
            card.classList.add('matched');
        });
        resetBoard(); // Usar resetBoard
    }

    function unflipCards() { // Usar unflipCards
        setTimeout(() => {
            flippedCards.forEach(card => {
                card.classList.remove('flipped');
            });
            resetBoard(); // Usar resetBoard
        }, 1000); // Voltear después de 1 segundo
    }

    function resetBoard() { // Usar resetBoard
        [flippedCards, lockBoard] = [[], false];
    }


    // --- Inicialización General ---
    window.onload = function () {
        // Inicializar Three.js
        if (typeof THREE !== 'undefined') {
            initThreeJS();
            // Asignar los event listeners a los botones del Merge Cube
            document.getElementById('showApple').addEventListener('click', () => showVirtualObject('apple'));
            document.getElementById('showFlower').addEventListener('click', () => showVirtualObject('flower'));
            document.getElementById('showCaterpillar').addEventListener('click', () => showVirtualObject('caterpillar'));
            document.getElementById('clearCube').addEventListener('click', () => showVirtualObject('clear'));
        } else {
            console.warn("THREE.js no está cargado. Asegúrate de que el CDN de Three.js esté en el HTML.");
        }

        // Inicializar el Memorama 4x4 al cargar la página
        initMemoryGame4x4(); // Cambiado a 4x4
    }
});
