# Clima 🌤️

Aplicación del tiempo construida con **Angular 19**, con una interfaz moderna, fluida y responsiva. Muestra condiciones actuales, pronóstico por hora y a 10 días, calidad del aire y más, para cualquier ciudad del mundo.

## Características ✨

- 🔍 **Búsqueda con autocompletado** de ciudades de todo el mundo, navegable con teclado (`/` o `Ctrl+K` para enfocar, flechas y `Enter` para elegir).
- 📍 **Geolocalización**: clima de tu ubicación actual con un clic.
- ⭐ **Favoritos y búsquedas recientes**, guardados en el navegador.
- 🌡️ **Condiciones actuales**: temperatura, sensación térmica, máx./mín. y un resumen de lo que viene ("Posibilidad de precipitaciones desde las 14 h").
- ⏱️ **Próximas 24 horas** con curva de temperatura y probabilidad de lluvia.
- 📅 **Pronóstico de 10 días** con barras de rango de temperatura y detalle expandible por día.
- 🍃 **Calidad del aire** (índice europeo EAQI y contaminantes PM2.5, PM10, O₃, NO₂).
- ☀️ **Detalles**: índice UV, viento con brújula, arco solar con amanecer/atardecer, humedad y punto de rocío, presión, visibilidad, nubosidad y precipitación.
- 🔁 **°C / °F** instantáneo, sin volver a consultar la API.
- 🎨 **Fondo animado dinámico** que cambia según el clima y si es de día o de noche (sol, estrellas, nubes, lluvia, nieve, tormenta, niebla), con íconos SVG animados propios.
- 🕒 **Hora local de la ciudad** consultada y actualización automática cada 15 minutos.
- ♿ Accesible (roles ARIA, navegación por teclado, respeta `prefers-reduced-motion`) y adaptado a móviles.

## Tecnologías 🛠️

- **Angular 19**: componentes standalone, **signals**, nuevo control flow (`@if`, `@for`, `@let`), `OnPush` y SSR/prerender.
- **TypeScript** estricto y **SCSS**.
- **RxJS** para la búsqueda con debounce y la combinación de peticiones.
- **Open-Meteo** (pronóstico, calidad del aire y geocodificación): gratuita y **sin API key**.
- **Jasmine + Karma** para tests unitarios.

## Estructura 📁

```
src/app
├── core
│   ├── models       # Tipos del dominio (WeatherReport, Place, …)
│   ├── services     # API, store con signals, preferencias y unidades
│   └── utils        # Códigos WMO, fechas por zona horaria
├── features         # Buscador, condición actual, por hora, 10 días, detalles, fondo
├── shared           # Íconos de interfaz, íconos del clima, banderas
└── testing          # Datos de prueba
```

## Cómo ejecutarlo 🚀

```bash
npm install
npm start          # http://localhost:4200
npm test           # tests unitarios
npm run build      # build de producción (con prerender)
```

No hace falta configurar ninguna clave de API.

## Créditos

Datos meteorológicos de [Open-Meteo](https://open-meteo.com/) · Banderas de [flagcdn](https://flagcdn.com/).

## Licencia 📄

Este proyecto está bajo la licencia **MIT**.
