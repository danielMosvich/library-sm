# 🍞 Sistema de Breadcrumbs Simplificado

## 🎯 **Súper Simple y Directo**

Solo necesitas pasar un array de objetos al hook `useBreadcrumbs()` en cada página donde quieras breadcrumbs.

## 📋 Uso Básico

```typescript
import { useBreadcrumbs } from "../hooks/useBreadcrumbs";

export default function MiPagina() {
  // Define los breadcrumbs directamente en la página
  useBreadcrumbs([
    { label: "Inicio", href: "/", icon: "🏠" },
    { label: "Categorías", href: "/categories", icon: "📦" },
    { label: "Mi Categoría Actual" } // Sin href = es la página actual
  ]);

  return <div>Mi contenido...</div>;
}
```

## 🎨 Estructura del Objeto Breadcrumb

```typescript
interface BreadcrumbItem {
  label: string;    // Texto que se muestra
  href?: string;    // URL para navegación (opcional)
  icon?: string;    // Icono/emoji (opcional)
}
```

## 📚 Ejemplos Reales

### **Página Principal de Categorías**
```typescript
useBreadcrumbs([
  { label: "Inicio", href: "/", icon: "🏠" },
  { label: "Categorías", icon: "📦" }
]);
```

### **Formulario Agregar Categoría**
```typescript
useBreadcrumbs([
  { label: "Inicio", href: "/", icon: "🏠" },
  { label: "Categorías", href: "/categories", icon: "📦" },
  { label: "Agregar Categoría", icon: "➕" }
]);
```

### **Vista de Subcategoría (Dinámico)**
```typescript
// Si tienes una jerarquía de categorías dinámicas
const categoryPath = [
  { id: "1", name: "Electrónicos" },
  { id: "2", name: "Computadoras" },
  { id: "3", name: "Laptops" }
];

useBreadcrumbs([
  { label: "Inicio", href: "/", icon: "🏠" },
  { label: "Categorías", href: "/categories", icon: "📦" },
  ...categoryPath.map((cat, index) => ({
    label: cat.name,
    href: index < categoryPath.length - 1 ? `/categories/${cat.id}` : undefined,
    icon: "📁"
  }))
]);
```

### **Página de Productos**
```typescript
useBreadcrumbs([
  { label: "Inicio", href: "/", icon: "🏠" },
  { label: "Productos", icon: "🛍️" }
]);
```

### **Editar Producto**
```typescript
useBreadcrumbs([
  { label: "Inicio", href: "/", icon: "🏠" },
  { label: "Productos", href: "/products", icon: "🛍️" },
  { label: `Editar: ${productName}`, icon: "✏️" }
]);
```

### **Página de Inventario**
```typescript
useBreadcrumbs([
  { label: "Inicio", href: "/", icon: "🏠" },
  { label: "Inventario", icon: "📊" }
]);
```

### **Configuración con Subsección**
```typescript
useBreadcrumbs([
  { label: "Inicio", href: "/", icon: "🏠" },
  { label: "Configuración", href: "/settings", icon: "⚙️" },
  { label: "Usuarios", icon: "👥" }
]);
```

## 🚀 Ventajas de Este Enfoque

### ✅ **1. Súper Simple**
- No hay helpers complicados
- No hay builders complejos 
- Solo arrays simples y directos

### ✅ **2. Completamente Personalizable**
- Cada página define exactamente lo que necesita
- Fácil de entender y modificar
- Sin abstracciones innecesarias

### ✅ **3. Fácil de Mantener**
- Breadcrumbs están en la misma página donde se usan
- Cambios locales no afectan otras páginas
- Debugging super fácil

### ✅ **4. Flexible para Casos Dinámicos**
- Funciona perfecto con datos de API
- Fácil construir breadcrumbs con `.map()`
- Condicionales simples con ternarios

### ✅ **5. TypeScript Completo**
- Autocompletado en todos los objetos
- Validación de tipos automática
- Errores detectados en tiempo de desarrollo

## 🎯 Casos de Uso Comunes

### **Con Datos de API**
```typescript
function ProductDetail({ productId }: { productId: string }) {
  const { data: product } = useQuery(['product', productId], () => 
    fetchProduct(productId)
  );

  useBreadcrumbs([
    { label: "Inicio", href: "/", icon: "🏠" },
    { label: "Productos", href: "/products", icon: "🛍️" },
    { label: product?.name || "Cargando...", icon: "📦" }
  ]);

  return <div>Detalle del producto...</div>;
}
```

### **Con Jerarquía Condicional**
```typescript
function CategoryEdit({ categoryId }: { categoryId: string }) {
  const { data: category } = useQuery(['category', categoryId]);
  const { data: parentPath } = useQuery(['categoryPath', categoryId]);

  useBreadcrumbs([
    { label: "Inicio", href: "/", icon: "🏠" },
    { label: "Categorías", href: "/categories", icon: "📦" },
    // Agregar padres si existen
    ...(parentPath || []).map(parent => ({
      label: parent.name,
      href: `/categories/${parent.id}`,
      icon: "📁"
    })),
    // Elemento actual
    { label: `Editar: ${category?.name || "..."}`, icon: "✏️" }
  ]);

  return <div>Formulario de edición...</div>;
}
```

### **Con Estados de Carga**
```typescript
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading } = useQuery(['user', userId]);

  useBreadcrumbs([
    { label: "Inicio", href: "/", icon: "🏠" },
    { label: "Usuarios", href: "/users", icon: "👥" },
    { 
      label: isLoading ? "Cargando..." : (user?.name || "Usuario"), 
      icon: "👤" 
    }
  ]);

  return <div>Perfil de usuario...</div>;
}
```

## 🎉 **¡Esto es todo!**

**No necesitas nada más complejo.** Este enfoque es:

- ✅ **Simple de entender**
- ✅ **Fácil de implementar** 
- ✅ **Completamente personalizable**
- ✅ **Escalable para cualquier proyecto**

¡Solo define tu array de breadcrumbs en cada página y listo! 🚀
