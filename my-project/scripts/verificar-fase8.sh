#!/bin/bash

# Script de verificación de la Fase 8 - Pantallas frontend
# Verifica que todos los componentes de páginas estén implementados

echo "=================================="
echo "VERIFICACIÓN FASE 8 - Pantallas Frontend"
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

echo "=== T078-T080 - Pantallas de autenticación ==="
check_file "src/ui/pages/RegisterPage.tsx"
check_file "src/ui/pages/RegisterPage.css"
check_file "src/ui/pages/LoginPage.tsx"
check_file "src/ui/pages/LoginPage.css"
check_file "src/ui/pages/ForgotPasswordPage.tsx"
check_file "src/ui/pages/ForgotPasswordPage.css"
echo ""

echo "=== T081-T082 - Pantallas de publicaciones ==="
check_file "src/ui/pages/FeedPage.tsx"
check_file "src/ui/pages/FeedPage.css"
check_file "src/ui/pages/ProfilePage.tsx"
check_file "src/ui/pages/ProfilePage.css"
echo ""

echo "=== T083-T085 - Componentes de publicaciones ==="
check_file "src/ui/components/post/PostForm.tsx"
check_file "src/ui/components/post/PostForm.css"
check_file "src/ui/components/post/PostCard.tsx"
check_file "src/ui/components/post/PostCard.css"
check_file "src/ui/components/post/PostList.tsx"
check_file "src/ui/components/post/PostList.css"
check_file "src/ui/components/post/index.ts"
echo ""

echo "=== T086 - Pantalla de administración ==="
check_file "src/ui/pages/AdminPanelPage.tsx"
check_file "src/ui/pages/AdminPanelPage.css"
echo ""

echo "=== T087 - Pantalla de edición de perfil ==="
check_file "src/ui/pages/EditProfilePage.tsx"
check_file "src/ui/pages/EditProfilePage.css"
echo ""

echo "=== Archivos de índice ==="
check_file "src/ui/pages/index.ts"
echo ""

echo "=== Verificación de rutas actualizadas ==="
if grep -q "FeedPage" src/routes.tsx 2>/dev/null; then
    echo -e "${GREEN}✓${NC} routes.tsx actualizado con FeedPage"
else
    echo -e "${RED}✗${NC} routes.tsx NO importa FeedPage"
    ((ERRORS++))
fi

if grep -q "ProfilePage" src/routes.tsx 2>/dev/null; then
    echo -e "${GREEN}✓${NC} routes.tsx actualizado con ProfilePage"
else
    echo -e "${RED}✗${NC} routes.tsx NO importa ProfilePage"
    ((ERRORS++))
fi

if grep -q "EditProfilePage" src/routes.tsx 2>/dev/null; then
    echo -e "${GREEN}✓${NC} routes.tsx actualizado con EditProfilePage"
else
    echo -e "${RED}✗${NC} routes.tsx NO importa EditProfilePage"
    ((ERRORS++))
fi

if grep -q "AdminPanelPage" src/routes.tsx 2>/dev/null; then
    echo -e "${GREEN}✓${NC} routes.tsx actualizado con AdminPanelPage"
else
    echo -e "${RED}✗${NC} routes.tsx NO importa AdminPanelPage"
    ((ERRORS++))
fi

echo ""
echo "=================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ FASE 8 COMPLETADA - Todas las pantallas verificadas${NC}"
    echo ""
    echo "Entregables completados:"
    echo "  ✓ 3 pantallas de autenticación (RegisterPage, LoginPage, ForgotPasswordPage)"
    echo "  ✓ 2 pantallas de publicaciones (FeedPage, ProfilePage)"
    echo "  ✓ 3 componentes de publicaciones (PostForm, PostCard, PostList)"
    echo "  ✓ 1 pantalla de administración (AdminPanelPage)"
    echo "  ✓ 1 pantalla de edición de perfil (EditProfilePage)"
    echo ""
    echo "Nota: Las pantallas están implementadas con UI completa."
    echo "La conexión con servicios se realizará en la Fase 9."
    echo ""
    echo "Próxima fase: Fase 9 - Integración pantallas-servicios"
    exit 0
else
    echo -e "${RED}✗ FALTAN $ERRORS ELEMENTOS${NC}"
    exit 1
fi
