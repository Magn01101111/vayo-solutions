# Vayo Solutions

Información del equipo
----------------------
Vayo Solutions es una aplicación web desarrollada por el Equipo N°08, Sección TPY1101.<br>
Para el curso TALLER APLICADO DE PROGRAMACION_004V (2026-1).<br>

Equipo compuesto por:
1. Jorge Escobar - Desarrollador.  <br>
2. Paula Toledo - Desarrollador.  <br>
3. Yoaldry Rodriguez - Scrum Master. <br>


Link tablero Trello:  
https://trello.com/invite/b/69cda7590b9b0af7953f5cbc/ATTI72d0d76e8cc14186865c844e33dbd214797D1434/vayo-solutions
------------------------

La aplicación está construida con TypeScript, HTML y SCSS y ofrece una base modular y escalable para el desarrollo frontend.

Composición del repositorio
---------------------------
- TypeScript
- HTML
- SCSS

Características
---------------
- Arquitectura basada en TypeScript para mayor robustez y mantenibilidad.
- Interfaz construida con HTML y estilos organizados en SCSS.
- Estructura pensada para facilitar la colaboración y el escalado del proyecto.


Requisitos
----------
- Node.js (>=16 recomendado) y npm o yarn.
- Navegador moderno para interfaz web.

Instalación (local)
-------------------
1. Clona el repositorio:
   git clone https://github.com/Magn01101111/vayo-solutions.git

2. Entra en el directorio del proyecto:
   cd vayo-solutions

3. Instala dependencias:
   npm install
   # o con yarn
   yarn install

Cómo ejecutar (desarrollo)
--------------------------
- Iniciar servidor de desarrollo:
  npm run dev
  # o
  yarn dev

- Construir para producción:
  npm run build
  # o
  yarn build

- Ejecutar versión de producción:
  npm start
  # o
  yarn start

Nota: los scripts exactos pueden variar según la configuración del package.json; ajusta los comandos si tu repo usa otros nombres de scripts (por ejemplo `serve`, `dev:watch`, etc.).

Estructura sugerida del proyecto
-------------------------------
- src/                → Código fuente (TypeScript, componentes)
- public/             → Recursos estáticos (HTML, imágenes)
- styles/             → SCSS y variables globales
- dist/ o build/      → Salida de la compilación
- package.json        → Scripts y dependencias

Buenas prácticas y recomendaciones
---------------------------------
- Usar ramas por feature y Pull Requests para revisión de código.
- Mantener estilos y variables SCSS centralizados.
- Documentar componentes y funciones complejas con comentarios y/o JSDoc.
- Configurar linter y formateador (ESLint + Prettier) para consistencia del código.

Testing (opcional)
------------------
- Si el proyecto incluye tests:
  npm test
  # o
  yarn test

Contribuir
----------
Si deseas contribuir:
1. Haz fork del repositorio.
2. Crea una rama con una descripción clara (feature/nombre, fix/nombre).
3. Abre un Pull Request con descripción del cambio.
4. Asigna reviewers y vincula el PR con tareas del tablero (Trello).


Notas finales
-------------
- Añade capturas de pantalla y ejemplos de uso en la sección "Características" o en una carpeta `docs/` para facilitar la presentación del proyecto.
- Si quieres, puedo:
  - ajustar secciones específicas (instalación, scripts, estructura) según el contenido real del repo,
  - o subir este README directamente al repositorio (confírmame rama destino y si deseas que cree un commit o un PR).

# VayoSolutions

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.11.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
