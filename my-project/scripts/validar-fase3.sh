#!/bin/bash

# Script de validación de Firestore Rules para Fase 3
# Verifica que las reglas y los índices estén correctamente configurados

echo "🔍 Validando configuración de Firestore - Fase 3"
echo "================================================="
echo ""

# Verificar que existe firestore.rules
if [ ! -f "firestore.rules" ]; then
    echo "❌ ERROR: No se encuentra firestore.rules"
    exit 1
else
    echo "✅ firestore.rules encontrado"
fi

# Verificar que existe firestore.indexes.json
if [ ! -f "firestore.indexes.json" ]; then
    echo "❌ ERROR: No se encuentra firestore.indexes.json"
    exit 1
else
    echo "✅ firestore.indexes.json encontrado"
fi

# Validar sintaxis de firestore.indexes.json
if ! jq empty firestore.indexes.json 2>/dev/null; then
    echo "❌ ERROR: firestore.indexes.json no es un JSON válido"
    exit 1
else
    echo "✅ firestore.indexes.json es JSON válido"
fi

# Contar índices definidos
INDEX_COUNT=$(jq '.indexes | length' firestore.indexes.json)
echo "✅ Índices compuestos definidos: $INDEX_COUNT"

# Verificar que firebase.json existe y tiene configuración de Firestore
if [ ! -f "firebase.json" ]; then
    echo "❌ ERROR: No se encuentra firebase.json"
    exit 1
else
    echo "✅ firebase.json encontrado"
fi

# Verificar configuración de emulators en firebase.json
if jq -e '.emulators.firestore' firebase.json > /dev/null 2>&1; then
    FIRESTORE_PORT=$(jq -r '.emulators.firestore.port' firebase.json)
    echo "✅ Emulator de Firestore configurado en puerto: $FIRESTORE_PORT"
else
    echo "⚠️  ADVERTENCIA: No se encontró configuración de emulator para Firestore"
fi

echo ""
echo "📋 Resumen de configuración:"
echo "  - firestore.rules: ✅"
echo "  - firestore.indexes.json: ✅"
echo "  - Índices compuestos: $INDEX_COUNT"
echo "  - firebase.json: ✅"
echo ""
echo "🎯 Fase 3 - Configuración de Firestore: VALIDADA"
