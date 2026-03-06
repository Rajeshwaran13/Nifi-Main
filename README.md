# NiFi Builder (data-flow-builder)

A high-performance, visual data flow builder inspired by Apache NiFi, built with React 19, @xyflow/react, and Zustand.

## 1. Features

- **NiFi-Style UI**: Professional dark theme with sharp edges, flat design, and a dot-grid canvas.
- **Drag & Drop Palette**: Categorized sidebar (Inputs, Outputs, Transformation, etc.) with search and toggleable expand/collapse states.
- **Node-Based Editing**: Create complex workflows by connecting nodes with smooth, handled edges.
- **Property Configuration**: Context-aware sidebar that opens on node selection to edit specific parameters (Settings, Properties, Comments).
- **Zustand State Management**: Centralized, high-performance state for nodes, edges, and UI layout.
- **Global Error Handling**: Integrated Axios interceptors with a Toast notification system for standardized API error reporting.
- **Web Component Export**: Easily embed the entire builder into any framework (Angular, Vue, or Vanilla JS) via the `data-flow-builder` custom element.

## 2. Usage (Development)

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Getting Started
1. Navigate to the project directory:
   ```bash
   cd nifi-builder
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## 3. Build Web Component

To generate a production-ready bundle for the web component:

```bash
npm run build
```

This will create a `dist/` folder containing:
- `data-flow-builder.es.js`: Standard ES module for modern browsers.
- `data-flow-builder.umd.js`: UMD bundle for legacy script inclusion.
- `style.css`: The required CSS for the builder.

## 4. Use in an Angular App

To use the NiFi Builder in an Angular application, follow these steps:

### Step 1: Enable Custom Elements
In your Angular module (e.g., `app.module.ts`), add `CUSTOM_ELEMENTS_SCHEMA`:

```typescript
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  declarations: [...],
  imports: [...],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Required to allow non-Angular tags
  bootstrap: [...]
})
export class AppModule { }
```

### Step 2: Import the Component
Include the built script and CSS in your project. You can copy them to your `assets/` folder and include them in `angular.json`:

```json
"styles": [
  "src/styles.css",
  "src/assets/nifi-builder/style.css"
],
"scripts": [
  "src/assets/nifi-builder/data-flow-builder.es.js"
]
```

Alternatively, import the JS file in your `main.ts`:
```typescript
import './assets/nifi-builder/data-flow-builder.es.js';
```

### Step 3: Embed in Template
Now you can use the tag directly in your component templates:

```html
<div class="builder-wrapper">
  <data-flow-builder></data-flow-builder>
</div>
```

### Step 4: Styling
Ensure the wrapper container has a defined height, as the builder expands to fill its parent:

```css
.builder-wrapper {
  width: 100%;
  height: 800px;
}
```
