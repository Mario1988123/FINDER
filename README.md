# 🎯 Object Finder - Localizador de Objetos con Giroscopio

Una aplicación web que simula un localizador de objetos usando el giroscopio del dispositivo móvil. Perfecta para juegos, bromas y entretenimiento.

## ✨ Características

- 📱 **Detección de orientación**: Usa el giroscopio del móvil para detectar la rotación del dispositivo
- 🎚️ **Señal visual**: Barras de señal y radar animado que aumentan al acercarte al ángulo objetivo
- 🔊 **Alertas sonoras**: Pitidos que se aceleran conforme te acercas al objetivo
- ⚙️ **Configuración personalizable**: Ajusta el ángulo objetivo, tolerancia y sensibilidad
- 🎨 **Diseño moderno**: Interfaz estilo radar con efectos de neón y animaciones fluidas
- 💾 **Persistencia**: Guarda tu configuración en el navegador

## 🚀 Cómo usar

### Inicio rápido

1. Abre `index.html` en un navegador móvil (Safari, Chrome, Firefox)
2. Presiona el botón de **ENCENDER** (⏻)
3. Si es necesario, permite el acceso al sensor de orientación
4. Gira el dispositivo lentamente hasta que la señal aumente
5. Cuando alcances el ángulo configurado, ¡sonará un pitido continuo!

### Configuración

1. Toca el ícono de engranaje (⚙️) en la parte superior derecha
2. Ajusta los parámetros:
   - **Ángulo objetivo**: El ángulo en grados donde se "encuentra" el objeto (0-360°)
   - **Tolerancia**: Margen de error en grados (±1-45°)
   - **Sensibilidad**: Qué tan rápido responde la señal (Baja/Media/Alta)
3. Presiona **Guardar**

## 🎮 Modos de uso

### Modo Juego
- Configura un ángulo secreto (por ejemplo, 270°)
- Dale el dispositivo a un amigo
- Deben girar el dispositivo hasta encontrar el "objeto"

### Modo Broma
- Ajusta la tolerancia muy baja (±1-5°) para hacerlo difícil
- O configura una sensibilidad alta para que sea muy sensible

### Modo Espectáculo
- Úsalo para "encontrar" cartas, objetos o personas específicas
- Configura previamente el ángulo donde estará el "objetivo"

## 📱 Compatibilidad

### Navegadores soportados:
- ✅ Safari iOS (iPhone/iPad)
- ✅ Chrome Android
- ✅ Firefox Android
- ✅ Samsung Internet

### Requisitos:
- Dispositivo con giroscopio/sensor de orientación
- HTTPS (requerido para acceso a sensores)
- Permisos de orientación habilitados

## 🔧 Desarrollo

### Estructura del proyecto

```
FINDER/
├── index.html      # Estructura HTML principal
├── style.css       # Estilos y animaciones
├── app.js          # Lógica de la aplicación
└── README.md       # Este archivo
```

### Tecnologías utilizadas

- HTML5
- CSS3 (Gradientes, Animaciones, Flexbox)
- JavaScript (ES6+)
- DeviceOrientation API
- Web Audio API

### Cómo funciona

1. **Detección de orientación**: Usa `DeviceOrientationEvent` para obtener los ángulos alfa (compass), beta y gamma
2. **Cálculo de señal**: Compara el ángulo actual con el objetivo y calcula la distancia angular
3. **Visualización**: Actualiza las barras de señal y el porcentaje en tiempo real
4. **Audio**: Genera tonos usando `Web Audio API` con frecuencia variable según la señal

### Personalización

#### Cambiar colores del tema
Edita las variables de color en `style.css`:
```css
/* Colores principales */
background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
color: #00d4ff; /* Azul neón */
color: #00ff88; /* Verde neón */
```

#### Ajustar sensibilidad del giroscopio
Modifica los factores en `app.js`:
```javascript
const sensitivityFactors = {
    low: 0.7,
    medium: 1.0,
    high: 1.3
};
```

#### Cambiar frecuencia de los pitidos
Ajusta los parámetros en la función `beep()`:
```javascript
const frequency = 800 + (this.signalStrength * 10);
const duration = 0.1;
```

## 🌐 Despliegue

### Opción 1: GitHub Pages
1. Sube los archivos a un repositorio de GitHub
2. Activa GitHub Pages en la configuración
3. Accede desde `https://tu-usuario.github.io/finder/`

### Opción 2: Netlify/Vercel
1. Arrastra la carpeta a Netlify o Vercel
2. Automáticamente se desplegará con HTTPS

### Opción 3: Servidor local (solo para pruebas)
```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve

# PHP
php -S localhost:8000
```

**⚠️ Nota**: Los sensores de orientación requieren HTTPS en producción.

## 🐛 Solución de problemas

### No funciona el giroscopio
- Verifica que estés usando HTTPS
- Comprueba que el navegador soporte `DeviceOrientationEvent`
- En iOS 13+, asegúrate de permitir el acceso a sensores de movimiento en Configuración > Safari > Movimiento y Orientación

### No se escucha el pitido
- Verifica el volumen del dispositivo
- Algunos navegadores bloquean el audio hasta que el usuario interactúe
- Prueba tocar la pantalla antes de encender el finder

### La señal no cambia
- Asegúrate de estar girando el dispositivo horizontalmente
- Intenta recalibrar apagando y encendiendo el finder
- Aumenta la sensibilidad en la configuración

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Siéntete libre de:
- Reportar bugs
- Sugerir nuevas características
- Enviar pull requests
- Mejorar la documentación

## 🎉 Créditos

Creado con ❤️ usando vanilla JavaScript, sin frameworks ni dependencias externas.

---

**¡Diviértete "encontrando" objetos con tu dispositivo móvil!** 🎯📱
