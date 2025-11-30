#!/bin/bash

# Script para generar APK usando servicio online
# Uso: ./build-apk-online.sh

echo "🔨 Preparando proyecto para build online..."

# Crear ZIP con el proyecto Cordova
cd /home/user/FINDER
zip -r object-finder-cordova.zip finder-android/ -x "*/node_modules/*" -x "*/.git/*"

echo "✅ Archivo listo: object-finder-cordova.zip"
echo ""
echo "📦 OPCIONES PARA CONSTRUIR EL APK:"
echo ""
echo "1️⃣  PHONEGAP BUILD (Gratis con cuenta Adobe):"
echo "   - Ve a: https://build.phonegap.com"
echo "   - Sube: object-finder-cordova.zip"
echo "   - Descarga el APK cuando termine"
echo ""
echo "2️⃣  APPGYVER (Sin cuenta necesaria):"
echo "   - Ve a: https://appgyver.com"
echo "   - Importa el proyecto Cordova"
echo "   - Build → Android → Descargar APK"
echo ""
echo "3️⃣  IONIC APPFLOW (14 días gratis):"
echo "   - Ve a: https://ionic.io/appflow"
echo "   - Conecta tu repositorio Git"
echo "   - Build automático del APK"
echo ""
echo "📁 El archivo ZIP está en:"
ls -lh object-finder-cordova.zip

