#!/bin/bash

# Script de verificación de la Fase 7 - Setup del frontend (UI)
# Verifica que todos los componentes y configuración base de UI estén implementados

echo "=================================="
echo "VERIFICACIÓN FASE 7 - Setup del Frontend (UI)"
echo "=================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Función para verificar archivo
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1 - NO ENCONTRADO"
        ((ERRORS++))
    fi
}

# Función para verificar directorio
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
    else
        echo -e "${RED}✗${NC} $1/ - NO ENCONTRADO"
        ((ERRORS++))
    fi
}

# Función para verificar contenido en archivo
check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $1 contiene '$2'"
    else
        echo -e "${RED}✗${NC} $1 NO contiene '$2'"
        ((ERRORS++))
    fi
}

echo "=== T070 - React Router v6 configurado ==="
check_file "package.json"
check_content "package.json" "react-router-dom"
check_file "src/App.tsx"
check_content "src/App.tsx" "RouterProvider"
echo ""

echo "=== T071 - Rutas configuradas ==="
check_file "src/routes.tsx"
check_content "src/routes.tsx" "/login"
check_content "src/routes.tsx" "/register"
check_content "src/routes.tsx" "/forgot-password"
check_content "src/routes.tsx" "/profile"
check_content "src/routes.tsx" "/admin"
check_content "src/routes.tsx" "ProtectedRoute"
check_content "src/routes.tsx" "AdminRoute"
echo ""

echo "=== T072 - Contexto y hook de autenticación ==="
check_file "src/ui/context/AuthContext.tsx"
check_file "src/ui/hooks/useAuth.tsx"
check_content "src/ui/context/AuthContext.tsx" "export function useAuth"
check_content "src/ui/context/AuthContext.tsx" "export function AuthProvider"
check_content "src/ui/context/AuthContext.tsx" "firebaseUser"
check_content "src/ui/context/AuthContext.tsx" "isAdmin"
echo ""

echo "=== T073 - Componente ProtectedRoute ==="
check_file "src/ui/components/ProtectedRoute.tsx"
check_content "src/ui/components/ProtectedRoute.tsx" "export function ProtectedRoute"
check_content "src/ui/components/ProtectedRoute.tsx" "useAuth"
check_content "src/ui/components/ProtectedRoute.tsx" "Navigate"
echo ""

echo "=== T074 - Componente AdminRoute ==="
check_file "src/ui/components/AdminRoute.tsx"
check_content "src/ui/components/AdminRoute.tsx" "export function AdminRoute"
check_content "src/ui/components/AdminRoute.tsx" "isAdmin"
check_content "src/ui/components/AdminRoute.tsx" "Navigate"
echo ""

echo "=== T075 - Estilos base ==="
check_file "src/ui/styles/global.css"
check_file "src/ui/styles/variables.css"
check_content "src/ui/styles/global.css" ":root"
check_content "src/ui/styles/variables.css" "--"
echo ""

echo "=== T076 - Componentes comunes ==="
check_dir "src/ui/components/common"
check_file "src/ui/components/common/Button.tsx"
check_file "src/ui/components/common/Input.tsx"
check_file "src/ui/components/common/Modal.tsx"
check_file "src/ui/components/common/Loading.tsx"
check_file "src/ui/components/common/ErrorMessage.tsx"
check_file "src/ui/components/common/Button.css"
check_file "src/ui/components/common/Input.css"
check_file "src/ui/components/common/Modal.css"
check_file "src/ui/components/common/Loading.css"
check_file "src/ui/components/common/ErrorMessage.css"
echo ""

echo "=== T077 - Layout base ==="
check_dir "src/ui/components/layout"
check_file "src/ui/components/layout/Header.tsx"
check_file "src/ui/components/layout/Footer.tsx"
check_file "src/ui/components/layout/Layout.tsx"
check_file "src/ui/components/layout/Header.css"
check_file "src/ui/components/layout/Footer.css"
check_file "src/ui/components/layout/Layout.css"
echo ""

echo "=== Verificación de integración ==="
echo -n "App.tsx usa AuthProvider: "
if check_content "src/App.tsx" "AuthProvider" &>/dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    ((ERRORS++))
fi

echo -n "App.tsx importa estilos globales: "
if check_content "src/App.tsx" "global.css" &>/dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    ((ERRORS++))
fi

echo ""
echo "=================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ FASE 7 COMPLETADA - Todos los componentes verificados${NC}"
    echo ""
    echo "Servidor de desarrollo corriendo en: http://localhost:5173"
    echo ""
    echo "Componentes implementados:"
    echo "  ✓ React Router v6 configurado"
    echo "  ✓ Rutas públicas y protegidas"
    echo "  ✓ Contexto de autenticación (useAuth)"
    echo "  ✓ ProtectedRoute y AdminRoute"
    echo "  ✓ Estilos base (CSS Variables)"
    echo "  ✓ Componentes comunes (Button, Input, Modal, Loading, ErrorMessage)"
    echo "  ✓ Layout base (Header, Footer, Layout)"
    echo ""
    echo "Próxima fase: Fase 8 - Pantallas frontend"
    exit 0
else
    echo -e "${RED}✗ FALTAN $ERRORS ELEMENTOS${NC}"
    exit 1
fi
