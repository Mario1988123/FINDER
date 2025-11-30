# 🔨 Guía para Compilar el APK

Tienes **3 opciones** para generar tu APK. Elige la que prefieras:

---

## ⚡ OPCIÓN 1: Android Studio (Recomendada) - 15 minutos

### Paso 1: Descarga Android Studio
- Ve a: https://developer.android.com/studio
- Descarga e instala Android Studio

### Paso 2: Abre el proyecto
1. Abre Android Studio
2. Click en **"Open an Existing Project"**
3. Navega a: `/home/user/FINDER/finder-android/platforms/android`
4. Click **OK**

### Paso 3: Espera la sincronización
- Android Studio descargará automáticamente el SDK y Gradle
- Esto puede tomar 5-10 minutos la primera vez
- Verás una barra de progreso en la parte inferior

### Paso 4: Compila el APK
1. Menú: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Espera a que compile (1-3 minutos)
3. Click en **"locate"** cuando aparezca la notificación

### Paso 5: Encuentra tu APK
```
finder-android/platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

### Paso 6: Instala en tu móvil
- **Opción A:** Conecta por USB y usa `adb install app-debug.apk`
- **Opción B:** Envía el APK por WhatsApp/Email y abre en tu móvil
- **Opción C:** Copia a una USB y pásalo al móvil

⚠️ **Habilita "Orígenes desconocidos"** en tu móvil:
- Android: Ajustes → Seguridad → Instalar apps desconocidas → Chrome/Mi Explorador

---

## 🌐 OPCIÓN 2: Compilación Online (5 minutos) - MÁS FÁCIL

### Usando PhoneGap Build (Gratis)

1. **Prepara el ZIP:**
   ```bash
   cd /home/user/FINDER
   chmod +x build-apk-online.sh
   ./build-apk-online.sh
   ```

2. **Sube a PhoneGap:**
   - Ve a: https://build.phonegap.com
   - Crea cuenta gratis (con GitHub o Adobe)
   - Click **"+ New App"**
   - Sube `object-finder-cordova.zip`

3. **Construye:**
   - Click en **"Build"** para Android
   - Espera 2-5 minutos
   - Descarga el APK cuando termine

4. **Instala en tu móvil:**
   - Escanea el QR code que te da
   - O descarga el APK y envíalo a tu móvil

### Alternativas Online:

**A) Ionic AppFlow (14 días gratis):**
- https://ionic.io/appflow
- Más profesional, incluye actualizaciones automáticas
- Solo necesitas conectar tu repo Git

**B) App.io (Build rápido):**
- https://app.io
- Sube el ZIP del proyecto
- APK listo en minutos

---

## 💻 OPCIÓN 3: Línea de Comandos (Avanzado) - 30 minutos

Si tenés Android SDK instalado en tu sistema:

### Paso 1: Instala Android SDK
```bash
# En Ubuntu/Debian:
sudo apt update
sudo apt install android-sdk

# En macOS:
brew install --cask android-sdk

# En Windows:
# Descarga de: https://developer.android.com/studio#command-tools
```

### Paso 2: Configura variables de entorno
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### Paso 3: Instala componentes necesarios
```bash
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"
```

### Paso 4: Compila el APK
```bash
cd /home/user/FINDER/finder-android
cordova build android --release
```

### Paso 5: El APK estará en:
```
platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### Paso 6: Firma el APK (opcional pero recomendado)
```bash
# Genera keystore
keytool -genkey -v -keystore my-release-key.keystore -alias object-finder -keyalg RSA -keysize 2048 -validity 10000

# Firma el APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore app-release-unsigned.apk object-finder

# Optimiza (zipalign)
zipalign -v 4 app-release-unsigned.apk object-finder.apk
```

---

## 🎯 COMPARACIÓN DE OPCIONES

| Método | Tiempo | Dificultad | Requisitos |
|--------|--------|-----------|------------|
| **Android Studio** | 15 min | ⭐⭐ Fácil | Descarga 1 GB |
| **Online (PhoneGap)** | 5 min | ⭐ Muy fácil | Cuenta gratis |
| **Línea de comandos** | 30 min | ⭐⭐⭐ Difícil | SDK instalado |

---

## 🚀 MI RECOMENDACIÓN

Para ti, lo **más rápido ahora mismo**:

### Si tenés buena conexión:
→ **OPCIÓN 1: Android Studio**
- Descargas, instalas, abres el proyecto y compilas
- Todo visual, sin comandos

### Si querés algo instantáneo:
→ **OPCIÓN 2: PhoneGap Build**
- Ejecuta `./build-apk-online.sh`
- Sube el ZIP
- Descarga APK en 5 minutos

---

## ❓ Problemas Comunes

### "Gradle sync failed"
- Solución: Espera que termine de descargar, puede tomar 10 min

### "SDK not found"
- Solución: Android Studio lo descarga automáticamente

### "No se puede instalar APK"
- Solución: Habilita "Orígenes desconocidos" en Ajustes → Seguridad

### APK muy grande
- Normal, el APK debug pesa 4-10 MB
- El release firmado será más pequeño

---

## 📞 ¿Cuál elijo?

**¿Tienes Android Studio?** → Usa OPCIÓN 1
**¿No quieres instalar nada?** → Usa OPCIÓN 2
**¿Eres desarrollador?** → Usa OPCIÓN 3

---

🎯 **Lo más fácil:** Ejecuta `./build-apk-online.sh` y usa PhoneGap Build
