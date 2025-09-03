# Sistema de Breadcrumbs Reutilizable

Este sistema permite manejar breadcrumbs de forma global y reutilizable en toda la aplicación usando Zustand.

## 🚀 Características

- **Global**: Los breadcrumbs se muestran automáticamente en el layout principal
- **Reutilizable**: Fácil de usar desde cualquier componente
- **Flexible**: Soporte para enlaces, íconos y texto personalizado
- **Helpers incluidos**: Funciones predefinidas para casos comunes

## 📦 Componentes

### `useUiStore` - Store Global
Maneja el estado global de los breadcrumbs:

```typescript
// Acciones disponibles
setBreadcrumbs(breadcrumbs: BreadcrumbItem[]): void
addBreadcrumb(breadcrumb: BreadcrumbItem): void  
clearBreadcrumbs(): void
```

### `useBreadcrumbs` - Hook personalizado
Hook para configurar breadcrumbs fácilmente:

```typescript
import { useBreadcrumbs } from '../hooks/useBreadcrumbs';

// En tu componente
useBreadcrumbs([
  { label: 'Inicio', href: '/', icon: '🏠' },
  { label: 'Productos', href: '/products', icon: '🛍️' },
  { label: 'Producto Actual' } // Último elemento sin href
]);
```

### `createBreadcrumbs` - Helpers predefinidos
Funciones helper para casos comunes:

```typescript
import { createBreadcrumbs } from '../hooks/useBreadcrumbs';

// Para categorías
useBreadcrumbs(createBreadcrumbs.categories([
  { id: '1', name: 'Electrónicos' },
  { id: '2', name: 'Computadoras' }
]));

// Para formularios
useBreadcrumbs(createBreadcrumbs.categoryForm('edit', 'Mi Categoría'));

// Para productos
useBreadcrumbs(createBreadcrumbs.products());

// Para inventario
useBreadcrumbs(createBreadcrumbs.inventory());

// Personalizado
useBreadcrumbs(createBreadcrumbs.custom([
  { label: 'Custom', href: '/custom', icon: '⚙️' }
]));
```

## 🛠️ Uso Básico

### 1. Configurar breadcrumbs en un componente

```typescript
import { useBreadcrumbs, createBreadcrumbs } from '../hooks/useBreadcrumbs';

export default function MiComponente() {
  // Opción 1: Usando helpers predefinidos
  useBreadcrumbs(createBreadcrumbs.categories());

  // Opción 2: Breadcrumbs personalizados
  useBreadcrumbs([
    { label: 'Inicio', href: '/', icon: '🏠' },
    { label: 'Mi Página Actual' }
  ]);

  return <div>Mi contenido...</div>;
}
```

### 2. Breadcrumbs dinámicos

```typescript
import { useBreadcrumbs, createBreadcrumbs } from '../hooks/useBreadcrumbs';

export default function CategoryView() {
  const { data: category } = useQuery(...);
  const { data: breadcrumbPath } = useQuery(...);

  // Se actualiza automáticamente cuando cambian los datos
  useBreadcrumbs(
    breadcrumbPath 
      ? createBreadcrumbs.categories(breadcrumbPath)
      : createBreadcrumbs.categories()
  );

  return <div>Vista de categoría...</div>;
}
```

## 📋 Tipos

```typescript
interface BreadcrumbItem {
  label: string;    // Texto a mostrar
  href?: string;    // URL para navegación (opcional)
  icon?: string;    // Icono/emoji (opcional)
}
```

## ✨ Características Avanzadas

### Limpieza automática
Los breadcrumbs se limpian automáticamente cuando el componente se desmonta.

### Sin persistencia
Los breadcrumbs no se guardan en localStorage - son específicos de la sesión actual.

### Renderizado condicional
Si no hay breadcrumbs configurados, el componente no se renderiza.

## 🎯 Ejemplos de Uso

### Categorías con jerarquía
```typescript
// En CategoryView.tsx
const categoryPath = [
  { id: '1', name: 'Electrónicos' },
  { id: '2', name: 'Computadoras' },
  { id: '3', name: 'Laptops' }
];

useBreadcrumbs(createBreadcrumbs.categories(categoryPath));
// Resultado: Inicio > Categorías > Electrónicos > Computadoras > Laptops
```

### Formulario de edición
```typescript
// En CategoryEdit.tsx
useBreadcrumbs(createBreadcrumbs.categoryForm('edit', 'Mi Categoría'));
// Resultado: Inicio > Categorías > Editar: Mi Categoría
```

### Breadcrumbs completamente personalizados
```typescript
useBreadcrumbs([
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Configuración', href: '/settings', icon: '⚙️' },
  { label: 'Usuarios', href: '/settings/users', icon: '👥' },
  { label: 'Editar Usuario', icon: '✏️' }
]);
```

## 🔧 Integración

El componente `<Breadcrumbs />` ya está integrado en el layout principal (`src/layout/main.tsx`), por lo que los breadcrumbs aparecerán automáticamente en todas las páginas que los configuren.

¡No necesitas importar ni renderizar el componente Breadcrumbs manualmente - solo configura los breadcrumbs con el hook y aparecerán automáticamente! 🎉
