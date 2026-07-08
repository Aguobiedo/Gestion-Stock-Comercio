# Sistema de Gestión de Ventas

## Descripción

Se trata de un sistema desarrollado para facilitar la administración de comercios minoristas. Permite gestionar el catálogo de productos, controlar el stock en tiempo real y registrar las ventas realizadas, centralizando la información en una única plataforma.

El sistema automatiza la actualización del inventario después de cada venta, registra el historial de las operaciones comerciales y proporciona herramientas para consultar las ventas y el total facturado durante la jornada. De esta forma, contribuye a mejorar el control del negocio, reducir errores en la gestión de mercadería y agilizar las tareas diarias.


## Características

### Seguridad y Autenticación

- Autenticación mediante **JSON Web Tokens (JWT)**.
- Contraseñas protegidas mediante **bcrypt**.
- Acceso restringido para usuarios autorizados.

### Gestión de Productos

- Alta, baja lógica, modificación y consulta de productos (ABM).
- Búsqueda rápida mediante código de barras o identificador único.
- Configuración de stock mínimo para alertas de reposición.
- Administración centralizada del catálogo de productos.

### Gestión de Ventas

- Registro de ventas con múltiples productos.
- Generación automática del detalle de venta.
- Cálculo automático de subtotales y del total de cada operación.
- Consulta del total vendido y la cantidad de operaciones realizadas durante el día.

### Control de Stock

- Actualización automática del stock al confirmar una venta.
- Descuento inmediato de las unidades vendidas.
- Configuración de stock mínimo para facilitar la reposición de productos.
