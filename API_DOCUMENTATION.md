# Documentación de la API

Esta API utiliza inteligencia artificial para realizar dos tareas principales: categorizar productos y generar tags relacionados.

---

## **1. Categorizar productos**
### **POST** `/api/ai/question`

### **Descripción:**
Recibe un producto y una lista de subcategorías, y devuelve la subcategoría más adecuada.

### **Entrada esperada:**
```json
{
  "product": "Lapicero BIC",
  "subcategories": [
    { "id": "sub-1", "name": "útiles de escritura" },
    { "id": "sub-2", "name": "papelería" }
  ]
}
```

### **Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "name": "útiles de escritura",
    "id": "sub-1"
  }
}
```

### **Errores posibles:**
- **400 Bad Request:**
  ```json
  {
    "success": false,
    "error": {
      "message": "El campo 'product' es requerido y no puede estar vacío",
      "code": "INVALID_PRODUCT"
    }
  }
  ```
- **422 Unprocessable Entity:**
  ```json
  {
    "success": false,
    "error": {
      "message": "No se encontró una subcategoría adecuada para este producto",
      "code": "NO_MATCH"
    }
  }
  ```
- **500 Internal Server Error:**
  ```json
  {
    "success": false,
    "error": {
      "message": "Error interno del servidor",
      "code": "INTERNAL_SERVER_ERROR",
      "detalle": "Detalles del error"
    }
  }
  ```

---

## **2. Generar tags**
### **POST** `/api/ai/tags`

### **Descripción:**
Recibe el nombre de un producto y su categoría, y devuelve una lista de tags relacionados.

### **Entrada esperada:**
```json
{
  "nombre": "Lapicero BIC",
  "category": "útiles de oficina"
}
```

### **Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "tags": ["lapicero", "bolígrafo", "pluma", "esfero"]
  }
}
```

### **Errores posibles:**
- **400 Bad Request:**
  ```json
  {
    "success": false,
    "error": {
      "message": "Los campos 'nombre' y 'category' son requeridos y no pueden estar vacíos",
      "code": "INVALID_INPUT"
    }
  }
  ```
- **500 Internal Server Error:**
  ```json
  {
    "success": false,
    "error": {
      "message": "La IA no devolvió una lista válida de tags",
      "code": "INVALID_TAGS_RESPONSE",
      "detalle": "Respuesta de la IA"
    }
  }
  ```

---

## **Formato de respuesta estándar:**
### **Éxito:**
```json
{
  "success": true,
  "data": { ... }
}
```

### **Error:**
```json
{
  "success": false,
  "error": {
    "message": "Descripción del error",
    "code": "CÓDIGO_DEL_ERROR",
    "detalle": "Detalles adicionales (opcional)"
  }
}
```
