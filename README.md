# Validation That Lies

A form with **client-side** and **server-side** validation where client validation rules are not stable and cannot be trusted. The server is the source of truth; the client may accept inputs the server rejects, and the server may reject inputs that passed client validation.

## Stack

- React 18
- Vite 5

## Quick start

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (e.g. `http://localhost:5173`).

**Build for production:**

```bash
npm run build
npm run preview
```

## What’s in the app

- **Form fields:** Email, Amount (numeric), Name (required text).
- **Client validation:** Rule-based, can change at runtime (see “Use loose/strict email rule” in the UI).
- **Server validation:** Mock API with different rules (e.g. only `@example.com` / `@allowed.org`, amount 1–1000, name min 2 chars).
- **Separate errors:** Client and server errors are stored and rendered separately; input is preserved on any failure.

## Project structure

```
src/
├── api/mockFormApi.js      # Mock server (source of truth for validation)
├── components/ValidationForm.jsx
├── hooks/useValidationForm.js   # Form state: values, clientErrors, serverErrors, submissionState
├── validation/clientRules.js    # Rule-based client validation (runtime-updatable)
├── App.jsx
├── main.jsx
└── index.css
```

## Documentation

- **[EXPLANATION.md](./EXPLANATION.md)** — How client rules are defined and updated, why client validation can’t be trusted, how server errors are shown without overwriting client errors, how input is preserved, and how error state is scoped and cleared.

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start dev server         |
| `npm run build`| Production build         |
| `npm run preview` | Preview production build |
