# JS Code Visualizer — Requirements Document

## 🎯 Project Overview

A **beginner-friendly, interactive JavaScript Code Visualizer** that lets users write or paste JS code and watch it execute **step-by-step** in real time. The app visually shows **everything that happens inside the JavaScript runtime** — the Call Stack, Event Loop, Callback Queue, Microtask Queue, Web APIs, Execution Contexts, Scope Chain, Memory Heap, Hoisting, Closures, and more — so that any beginner can truly understand how JavaScript works behind the scenes.

> **Think of it as "Loupe + Python Tutor on steroids" — a complete JS runtime visualizer, 100% client-side, hostable on GitHub Pages.**

---

## 🛠️ Tech Stack

| Layer              | Technology                          | Why                                                                 |
|--------------------|-------------------------------------|---------------------------------------------------------------------|
| **Framework**      | React 18                            | Component-based UI, huge ecosystem, beginner-friendly               |
| **Build Tool**     | Vite                                | Lightning-fast dev server & builds, simple config, static output    |
| **Code Editor**    | CodeMirror 6 (`@uiw/react-codemirror`) | Lightweight (~300KB), excellent JS syntax highlighting, line highlight API |
| **JS Parser**      | Acorn                               | Fast, lightweight, standard ESTree AST output                       |
| **Styling**        | Tailwind CSS                        | Rapid UI development, responsive-first, utility classes             |
| **Animations**     | Framer Motion                       | Smooth transitions for variable changes, stack push/pop, UI panels  |
| **Deployment**     | `gh-pages` npm package              | One-command deploy to GitHub Pages                                  |
| **Icons**          | Lucide React                        | Clean, lightweight icon set                                         |

### Why This Stack?

- **100% Static** — No backend needed. Everything runs in the browser. Perfect for GitHub Pages.
- **Vite + React** — Industry standard, fast development, easy to build and deploy as static files.
- **CodeMirror 6** — Much lighter than Monaco Editor (~300KB vs ~2MB), has great APIs for line decoration/highlighting.
- **Acorn** — Battle-tested JS parser used by many tools. Produces a standard AST we can instrument.

---

## 🏗️ Architecture — "Instrument & Trace" Approach

Instead of building a full JS interpreter (complex and limiting), we use a smarter approach:

```
User Code → Parse (Acorn) → Instrument AST → Execute → Collect Trace → Playback UI
```

### How It Works

1. **Parse** — User code is parsed into an AST (Abstract Syntax Tree) using Acorn.
2. **Instrument** — We walk the AST and inject tracing calls before/after each:
   - Statement execution (to track current line)
   - Variable declaration/assignment (to capture values)
   - Function call/return (to track call stack & execution context)
   - Scope entry/exit (to track scope chain)
   - `console.log()` calls (to capture output)
   - `setTimeout` / `setInterval` / `Promise` calls (to track event loop, queues)
   - Object/Array creation (to track memory heap)
3. **Execute** — The instrumented code runs in a sandboxed `Function()` context, collecting an ordered array of "trace steps."
4. **Playback** — The UI scrubs through the trace array. Each step contains:
   - Current line number
   - Variable snapshot (all scopes)
   - Call stack snapshot (with execution contexts)
   - Event loop state (what phase we're in)
   - Callback queue contents (macrotasks waiting)
   - Microtask queue contents (Promises waiting)
   - Web API timers in progress
   - Memory heap snapshot (object references)
   - Console output (if any)
   - Event description (e.g., "setTimeout callback moved from Web API to Callback Queue")

### Key Benefit

Since we have the **full execution trace** upfront, we get **forward AND backward stepping** for free. Users can scrub through execution like a video timeline.

### Simulated Runtime Environment

Since we run in the browser, we **simulate** the JS runtime internals:
- `setTimeout` / `setInterval` → Intercepted and scheduled in our simulated event loop
- `Promise.then` / `async/await` → Traced into the microtask queue
- `fetch` (mocked) → Simulated Web API with configurable delay
- The **Event Loop** continuously checks: "Is the call stack empty? → Process microtasks → Process next macrotask"

---

## ✨ Features

### 🔥 Core Runtime Visualization Panels (MVP)

These are the **heart of the application** — every panel that shows what's happening inside the JS engine:

| Panel | What It Shows | Why It Matters |
|-------|---------------|----------------|
| **📝 Code Editor** | Syntax-highlighted code with current line highlighted | Users see exactly which line is executing |
| **📦 Call Stack** | Stack of function calls with execution contexts (Global, Function, Eval) | Shows the order of function execution and what's currently running |
| **🔄 Event Loop** | Animated loop that checks: Call Stack → Microtasks → Macrotasks | The #1 confusing concept for beginners — made visual! |
| **⏳ Web APIs** | Active timers (`setTimeout`), pending `fetch` calls, event listeners | Shows what the browser is doing in the background |
| **📬 Callback Queue (Macrotask Queue)** | Callbacks waiting to be pushed to the call stack (`setTimeout` callbacks, etc.) | Shows why `setTimeout(fn, 0)` doesn't run immediately |
| **⚡ Microtask Queue** | Promise `.then()` callbacks, `queueMicrotask()`, `MutationObserver` | Shows why Promises run before `setTimeout` |
| **📋 Variables / Scope** | All variables organized by scope (Global, Function, Block) with current values | See exactly what each variable holds at each step |
| **🔗 Scope Chain** | Visual nesting showing how variable lookups traverse the scope chain | Understand lexical scoping and closures |
| **🧠 Memory Heap** | Objects, arrays, and functions as connected boxes with reference arrows | See how objects are stored by reference, not by value |
| **🎯 Execution Context** | Current context (Global/Function) with its `this` binding, outer reference, and variable environment | Understand `this`, hoisting, and how JS creates contexts |
| **🖥️ Console Output** | `console.log()` output as it appears during execution | See program output step by step |

### 🎮 Interaction & Controls (MVP)

| Feature | Description |
|---------|-------------|
| **Step Controls** | Step Forward, Step Backward, Play, Pause, Reset buttons |
| **Speed Control** | Slider to adjust auto-play speed (slow → fast) |
| **Execution Progress Bar** | Visual timeline: "Step 5 of 22" with scrubber |
| **Step Description** | Human-readable text: "setTimeout callback moved from Web API to Callback Queue" |
| **Example Library** | 15+ pre-loaded examples covering every runtime concept |
| **Error Handling** | Friendly, human-readable error messages for syntax/runtime errors |
| **Dark/Light Theme** | Toggle between dark and light mode |
| **Keyboard Shortcuts** | Arrow keys for stepping, Space for play/pause, R for reset |
| **Responsive Layout** | Works on desktop and tablets |

### 🔮 Advanced Features (Phase 2)

| Feature | Description |
|---------|-------------|
| **Hoisting Visualization** | Show a "hoisting phase" before execution where `var` and `function` declarations are lifted to the top |
| **Closure Visualization** | Highlight captured variables when a function "closes over" an outer scope |
| **`this` Keyword Tracker** | Show what `this` refers to in every execution context with arrows |
| **Prototype Chain** | Visualize prototype lookup for object property access |
| **Variable Change Animation** | Flash/highlight when a variable's value changes |
| **Breakpoints** | Click on line numbers to set breakpoints |
| **Share via URL** | Encode code in URL hash so users can share examples |
| **Garbage Collection Hint** | Show when objects become unreachable and would be garbage collected |

### 🚀 Future Enhancements (Phase 3)

| Feature | Description |
|---------|-------------|
| **async/await Deep Dive** | Step-by-step visualization of async function suspension and resumption |
| **Generator Functions** | Show `yield` pausing and `next()` resuming |
| **Step-by-Expression** | Step through individual expressions, not just lines |
| **Export as GIF/Video** | Record execution as a shareable animation |
| **Interactive Tutorials** | Guided walkthroughs explaining each runtime concept |

---

## 🎨 UI/UX Design

### Layout — Full Runtime View

```
┌──────────────────────────────────────────────────────────────────────────┐
│  🔍 JS Code Visualizer              [Examples ▼]  [🌙/☀️]              │
├─────────────────────┬────────────────────────────────────────────────────┤
│                     │  TOP-RIGHT: Runtime Internals                     │
│   📝 Code Editor    │                                                    │
│                     │  ┌──────────┐  ┌───────────┐  ┌──────────────┐   │
│  1│ console.log(1)  │  │📦 Call   │  │⏳ Web     │  │🎯 Execution  │   │
│  2│ setTimeout(…)   │  │  Stack   │  │  APIs     │  │   Context    │   │
│  3│ Promise.then(…) │  │          │  │           │  │              │   │
│→ 4│ console.log(2)  │  │ main()   │  │ timer(2s) │  │ this: window │   │
│  5│                 │  │ foo()    │  │ fetch()   │  │ outer: null  │   │
│                     │  └──────────┘  └───────────┘  └──────────────┘   │
│                     │                                                    │
│                     │  ┌─────────────────────────────────────────────┐  │
│                     │  │  🔄 EVENT LOOP                              │  │
│                     │  │  ┌─────────┐    ┌──────────┐   ┌─────────┐ │  │
│                     │  │  │⚡Micro- │ ←  │ 🔄 Event │ → │📬 Call- │ │  │
│                     │  │  │ task Q  │    │   Loop   │   │ back Q  │ │  │
│                     │  │  │         │    │ (animtd) │   │         │ │  │
│                     │  │  │.then()  │    └──────────┘   │ timer() │ │  │
│                     │  │  └─────────┘                   └─────────┘ │  │
│                     │  └─────────────────────────────────────────────┘  │
├─────────────────────┤                                                    │
│  📋 Variables       │  ┌────────────┐  ┌────────────────────────────┐   │
│  ┌───────────────┐  │  │🔗 Scope    │  │ 🧠 Memory Heap             │   │
│  │Global          │  │  │  Chain    │  │  ┌─────┐    ┌─────────┐   │   │
│  │  x: 5         │  │  │           │  │  │obj1 │───→│{a:1,b:2}│   │   │
│  │  y: "hello"   │  │  │ Block     │  │  └─────┘    └─────────┘   │   │
│  │foo()          │  │  │  ↓        │  │  ┌─────┐    ┌─────────┐   │   │
│  │  n: 3         │  │  │ foo()     │  │  │arr1 │───→│[1, 2, 3]│   │   │
│  └───────────────┘  │  │  ↓        │  │  └─────┘    └─────────┘   │   │
│                     │  │ Global    │  └────────────────────────────┘   │
│                     │  └────────────┘                                   │
├─────────────────────┴────────────────────────────────────────────────────┤
│  💬 "setTimeout callback moved from Web API → Callback Queue"           │
├──────────────────────────────────────────────────────────────────────────┤
│  [⏮] [⏪] [▶ Play] [⏩] [⏭]    Speed: [━━━●━━━]    Step 8 of 35      │
│  [━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━]       🖥️ Console: ▼   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Design Principles

- **Clean & Minimal** — No clutter. Beginners should not feel overwhelmed.
- **Color-Coded** — Use distinct colors for: current line (yellow/blue), changed variables (green flash), errors (red), call stack frames (gradient).
- **Smooth Animations** — Variable changes, stack push/pop, and line transitions should animate smoothly.
- **Responsive** — Desktop: side-by-side layout. Tablet: stacked layout. Mobile: scrollable panels.
- **Accessible** — Proper contrast ratios, keyboard navigation, screen reader labels.

### Theme

- **Light Mode** — Clean white background, soft shadows, professional feel.
- **Dark Mode** — Dark gray/navy background, syntax highlighting optimized for dark, easy on the eyes.

---

## 📂 Project Structure

```
js-visualizer/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── CodeEditor/              # CodeMirror wrapper with line highlighting
│   │   │   ├── CodeEditor.jsx
│   │   │   └── lineHighlight.js     # Custom CM extension for active line
│   │   ├── ExecutionControls/       # Play, Pause, Step, Reset, Speed slider
│   │   │   └── ExecutionControls.jsx
│   │   ├── CallStack/               # Visual call stack with execution contexts
│   │   │   └── CallStack.jsx
│   │   ├── EventLoop/               # Animated event loop visualization
│   │   │   └── EventLoop.jsx
│   │   ├── CallbackQueue/           # Macrotask queue display
│   │   │   └── CallbackQueue.jsx
│   │   ├── MicrotaskQueue/          # Microtask queue display
│   │   │   └── MicrotaskQueue.jsx
│   │   ├── WebAPIs/                 # Web APIs panel (timers, fetch, etc.)
│   │   │   └── WebAPIs.jsx
│   │   ├── VariablePanel/           # Variable inspector per scope
│   │   │   └── VariablePanel.jsx
│   │   ├── ScopeChain/              # Scope chain visualization
│   │   │   └── ScopeChain.jsx
│   │   ├── MemoryHeap/              # Memory heap / object reference diagram
│   │   │   └── MemoryHeap.jsx
│   │   ├── ExecutionContext/        # Current execution context display
│   │   │   └── ExecutionContext.jsx
│   │   ├── ConsoleOutput/           # Console.log display
│   │   │   └── ConsoleOutput.jsx
│   │   ├── StepDescription/         # Human-readable step explanation
│   │   │   └── StepDescription.jsx
│   │   ├── ExampleSelector/         # Dropdown of pre-loaded examples
│   │   │   └── ExampleSelector.jsx
│   │   └── Layout/                  # Main app layout (split panes)
│   │       └── Layout.jsx
│   ├── engine/
│   │   ├── parser.js                # Acorn-based code parser
│   │   ├── instrumenter.js          # AST instrumentation logic
│   │   ├── executor.js              # Sandboxed code execution
│   │   ├── tracer.js                # Trace step data structures
│   │   ├── eventLoop.js             # Simulated event loop engine
│   │   ├── webApis.js               # Simulated Web APIs (setTimeout, fetch, etc.)
│   │   └── memoryModel.js           # Memory heap tracking & object references
│   ├── examples/                    # Pre-loaded code examples
│   │   └── index.js
│   ├── hooks/
│   │   ├── useVisualizer.js         # Main hook managing execution state
│   │   └── useTheme.js              # Dark/light theme hook
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css                    # Tailwind imports + custom styles
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── requirements.md                  # This file
└── README.md
```

---

## 🧪 Pre-Loaded Example Categories

### Beginner — Language Basics
1. **Variables & Types** — `let`, `const`, `var`, data types, operators
2. **Conditionals** — `if/else`, ternary, `switch`
3. **Loops** — `for`, `while`, `do-while`, `for...of`
4. **Functions** — Declaration, parameters, return values, arrow functions
5. **Arrays** — Push, pop, map, filter, reduce
6. **Objects** — Properties, methods, destructuring

### Intermediate — Runtime Concepts
7. **Call Stack** — Nested function calls, stack overflow (recursion)
8. **Scope & Hoisting** — `var` vs `let` vs `const`, hoisting behavior, block scope
9. **Closures** — Counter factory, private variables, closure in loops
10. **`this` Keyword** — In global, object method, arrow function, `bind`/`call`

### Advanced — Async & Event Loop
11. **setTimeout & Event Loop** — Classic `setTimeout(fn, 0)` vs synchronous code
12. **Promises** — `.then()` chaining, microtask queue vs callback queue
13. **async/await** — How `await` suspends execution and resumes
14. **Mixed Async** — `console.log`, `setTimeout`, `Promise` execution order puzzle
15. **Event Loop Deep Dive** — Full example showing macrotask vs microtask priority

### Bonus — Interview Classics
16. **Closure in a Loop** — The classic `var` in `for` loop problem
17. **Promise Execution Order** — Predict the output challenge
18. **Call Stack Overflow** — Infinite recursion visualization

---

## 🚀 Deployment (GitHub Pages)

1. Build: `npm run build` → Produces static files in `dist/`
2. Deploy: `npm run deploy` → Uses `gh-pages` to push `dist/` to `gh-pages` branch
3. Configure: Set GitHub repo → Settings → Pages → Source: `gh-pages` branch
4. Vite config must set `base` to `/<repo-name>/` for correct asset paths

### Scripts in `package.json`

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "gh-pages -d dist"
  }
}
```

---

## ⚡ Performance Considerations

- **Web Worker for Execution** — Run instrumented code in a Web Worker to prevent UI freezing on infinite loops or heavy computation.
- **Execution Timeout** — Cap execution at 10,000 steps or 5 seconds to prevent browser hangs.
- **Lazy Rendering** — Only render visible parts of long traces.
- **Code Size Limit** — Warn if code exceeds ~500 lines (this is a learning tool, not an IDE).

---

## 📋 Summary

| Aspect | Decision |
|--------|----------|
| **Type** | Single Page Application (SPA) |
| **Hosting** | GitHub Pages (100% static) |
| **Framework** | React 18 + Vite |
| **Editor** | CodeMirror 6 |
| **Parser** | Acorn |
| **Styling** | Tailwind CSS |
| **Animations** | Framer Motion |
| **Target Audience** | Beginners learning JavaScript |
| **Browser Support** | Modern browsers (Chrome, Firefox, Safari, Edge) |
