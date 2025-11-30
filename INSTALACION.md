# 📱 Guía de Instalación - Object Finder

Tienes **3 opciones** para instalar la app en tu móvil:

---

## ✨ OPCIÓN 1: PWA (Instalación Directa) - RECOMENDADA 🚀

La forma más rápida y fácil. No requiere descargar APK ni compilar nada.

### Pasos:

1. **Despliega la app en un servidor con HTTPS:**

   **Opción A - GitHub Pages (Gratis y Fácil):**
   ```bash
   # Ya hice el commit, solo necesitas push
   git push origin claude/gyroscope-object-finder-01ELkdGbedws5zpa34VPJ9FT
   ```
   - Ve a tu repositorio en GitHub
   - Settings → Pages
   - Selecciona la rama y carpeta raíz
   - Guarda y espera unos minutos
   - Tu app estará en: `https://tu-usuario.github.io/FINDER/`

   **Opción B - Netlify (Instantáneo):**
   - Arrastra la carpeta FINDER a https://app.netlify.com/drop
   - Te dará una URL automáticamente con HTTPS

   **Opción C - Vercel:**
   ```bash
   npx vercel
   ```

2. **Abre la URL en tu móvil:**
   - Abre Chrome (Android) o Safari (iOS)
   - Visita la URL de tu app

3. **Instala la PWA:**

   **En Android (Chrome):**
   - Toca el menú (⋮) → "Agregar a pantalla de inicio" o "Instalar app"
   - La app aparecerá como una app nativa en tu móvil

   **En iOS (Safari):**
   - Toca el botón compartir (⬆️)
   - Selecciona "Agregar a pantalla de inicio"

4. **¡Listo!** 🎉
   - La app se abrirá en pantalla completa como una app nativa
   - Funcionará offline después de la primera visita
   - Tendrá su propio icono en el escritorio

---

## 📦 OPCIÓN 2: APK con Android Studio

Si prefieres un APK compilado, puedes usar el proyecto Cordova que preparé.

### Requisitos:
- Android Studio instalado
- Java JDK 11 o superior
- Conexión a internet

### Pasos:

1. **Importa el proyecto en Android Studio:**
   ```bash
   cd /home/user/FINDER/finder-android
   ```
   - Abre Android Studio
   - File → Open → Selecciona `/home/user/FINDER/finder-android/platforms/android`

2. **Espera a que Gradle sincronice:**
   - Android Studio descargará dependencias automáticamente

3. **Compila el APK:**
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Espera a que termine la compilación

4. **Encuentra tu APK:**
   - El APK estará en: `platforms/android/app/build/outputs/apk/debug/app-debug.apk`

5. **Instala en tu móvil:**
   - Conecta tu móvil por USB o envía el APK por email/WhatsApp
   - Habilita "Instalar apps desconocidas" en ajustes
   - Abre el APK y instala

---

## 🌐 OPCIÓN 3: Servicio Online de Build

Usa un servicio online para compilar el APK sin instalar nada.

### AppGyver / PhoneGap Build (Gratis):

1. Ve a https://build.phonegap.com/ (requiere cuenta Adobe)
2. Sube el contenido de `/home/user/FINDER/finder-android`
3. Construye el APK online
4. Descarga el APK compilado
5. Instala en tu móvil

---

## 🔧 Servidor Local para Pruebas

Si quieres probar la app localmente primero:

**Ya está corriendo en:** http://localhost:8080

Para acceder desde tu móvil en la misma red WiFi:

1. **Encuentra tu IP local:**
   ```bash
   ip addr show | grep "inet " | grep -v 127.0.0.1
   ```

2. **Abre en tu móvil:**
   - http://TU_IP:8080
   - Ejemplo: http://192.168.1.100:8080

**⚠️ NOTA:** Los sensores de giroscopio **requieren HTTPS** en producción. El servidor local solo sirve para ver el diseño, pero el giroscopio NO funcionará sin HTTPS.

---

## 🎯 Comparación de Opciones

| Característica | PWA | APK Studio | APK Online |
|---------------|-----|-----------|-----------|
| Tiempo | ⭐⭐⭐⭐⭐ 5 min | ⭐⭐ 30-60 min | ⭐⭐⭐ 15 min |
| Dificultad | ⭐⭐⭐⭐⭐ Muy fácil | ⭐⭐ Requiere setup | ⭐⭐⭐⭐ Fácil |
| Tamaño | ~50 KB | ~4-10 MB | ~4-10 MB |
| Actualizaciones | Automáticas | Manual | Manual |
| Offline | ✅ Sí | ✅ Sí | ✅ Sí |
| Funcionalidad | 100% | 100% | 100% |

**💡 Recomendación:** Usa la **Opción 1 (PWA)** para una instalación instantánea y actualizaciones automáticas.

---

## ❓ Solución de Problemas

### PWA no se puede instalar:
- Verifica que estás usando HTTPS
- Asegúrate de que manifest.json se carga correctamente
- Intenta en modo incógnito primero

### Giroscopio no funciona:
- DEBE usar HTTPS (localhost sin HTTPS no funcionará para sensores)
- En iOS: Settings → Safari → Motion & Orientation Access → Activar
- Permite permisos cuando la app los solicite

### APK no instala:
- Habilita "Orígenes desconocidos" o "Instalar apps desconocidas"
- Verifica que el APK no esté corrupto
- Intenta reinstalar

---

## 📞 Soporte

Si tienes problemas, verifica:
1. ¿Estás usando HTTPS? (obligatorio para sensores)
2. ¿El navegador soporta DeviceOrientation?
3. ¿Diste permisos de orientación?
4. ¿Tu dispositivo tiene giroscopio?

---

¡Disfruta tu Object Finder! 🎯📱
