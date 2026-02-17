/**
 * Pre-loaded code examples for the JS Code Visualizer.
 * Each example is short (5–15 lines), educational, and beginner-friendly.
 */

const examples = [
  // ─── Basics ───────────────────────────────────────────────
  {
    id: 'variables-types',
    title: 'Variables & Types',
    category: 'basics',
    description: 'Declaring variables with let, const, and var. See how each type is stored.',
    code: `// Variables & Types
let name = "Alice";
const age = 25;
var isStudent = true;

let score = 98.5;
let nothing = null;
let notDefined;

console.log(name, age);
console.log(typeof score);
console.log(typeof nothing);`,
  },
  {
    id: 'conditionals',
    title: 'Conditionals',
    category: 'basics',
    description: 'if/else branching — watch how only one path executes.',
    code: `// Conditionals
let temperature = 30;

if (temperature > 35) {
  console.log("It's hot!");
} else if (temperature > 20) {
  console.log("Nice weather");
} else {
  console.log("It's cold!");
}

let mood = temperature > 25 ? "happy" : "meh";
console.log(mood);`,
  },
  {
    id: 'loops',
    title: 'Loops',
    category: 'basics',
    description: 'for and while loops — watch variables change each iteration.',
    code: `// Loops
let sum = 0;

for (let i = 1; i <= 5; i++) {
  sum = sum + i;
  console.log("i:", i, "sum:", sum);
}

let count = 3;
while (count > 0) {
  console.log("countdown:", count);
  count--;
}`,
  },

  // ─── Functions ────────────────────────────────────────────
  {
    id: 'function-basics',
    title: 'Function Basics',
    category: 'functions',
    description: 'Function declarations, parameters, return values, and the call stack.',
    code: `// Function Basics
function greet(name) {
  let message = "Hello, " + name + "!";
  return message;
}

function add(a, b) {
  return a + b;
}

let greeting = greet("Alice");
console.log(greeting);

let result = add(3, 4);
console.log("3 + 4 =", result);`,
  },
  {
    id: 'recursion',
    title: 'Recursion (Factorial)',
    category: 'functions',
    description: 'A function that calls itself — watch the call stack grow and unwind.',
    code: `// Recursion — Factorial
function factorial(n) {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

let result = factorial(5);
console.log("5! =", result);`,
  },

  // ─── Arrays & Objects ─────────────────────────────────────
  {
    id: 'array-methods',
    title: 'Array Methods',
    category: 'arrays-objects',
    description: 'push, pop, map, filter — see arrays change in memory.',
    code: `// Array Methods
let fruits = ["apple", "banana", "cherry"];
console.log(fruits);

fruits.push("date");
console.log("after push:", fruits);

let last = fruits.pop();
console.log("popped:", last);

let lengths = fruits.map(function(f) {
  return f.length;
});
console.log("lengths:", lengths);`,
  },
  {
    id: 'object-basics',
    title: 'Object Basics',
    category: 'arrays-objects',
    description: 'Creating objects, accessing properties, and adding new ones.',
    code: `// Object Basics
let person = {
  name: "Alice",
  age: 25
};

console.log(person.name);
console.log(person.age);

person.job = "developer";
console.log(person);

let keys = Object.keys(person);
console.log("keys:", keys);`,
  },

  // ─── Scope ────────────────────────────────────────────────
  {
    id: 'scope-hoisting',
    title: 'Scope & Hoisting',
    category: 'scope',
    description: 'See how var is hoisted and how block scope works with let.',
    code: `// Scope & Hoisting
console.log(x); // undefined (hoisted)
var x = 10;
console.log(x); // 10

function demo() {
  var local = "I'm local";
  console.log(local);
}
demo();

// Block scope with let
if (true) {
  let blockVar = "inside block";
  console.log(blockVar);
}`,
  },
  {
    id: 'var-vs-let',
    title: 'var vs let',
    category: 'scope',
    description: 'var is function-scoped, let is block-scoped. A key difference!',
    code: `// var vs let
for (var i = 0; i < 3; i++) {
  // var i is function-scoped
}
console.log("var i after loop:", i); // 3

for (let j = 0; j < 3; j++) {
  // let j is block-scoped
  console.log("let j inside:", j);
}
// console.log(j); // would throw ReferenceError`,
  },

  // ─── Closures ─────────────────────────────────────────────
  {
    id: 'counter-closure',
    title: 'Counter Closure',
    category: 'closures',
    description: 'A function that "remembers" its outer variable — the classic closure.',
    code: `// Counter Closure
function makeCounter() {
  let count = 0;
  return function() {
    count++;
    return count;
  };
}

let counter = makeCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3`,
  },
  {
    id: 'closure-in-loop',
    title: 'Closure in Loop',
    category: 'closures',
    description: 'The classic var-in-loop bug vs the let fix. A common interview question!',
    code: `// Closure in Loop — the classic problem
// With var: all callbacks share the same i
var funcs = [];
for (var i = 0; i < 3; i++) {
  funcs.push(function() {
    console.log("var i:", i);
  });
}
funcs[0](); // 3 (not 0!)
funcs[1](); // 3
funcs[2](); // 3

// Fix with let: each iteration gets its own i
// let creates a new binding per iteration`,
  },

  // ─── Async ────────────────────────────────────────────────
  {
    id: 'settimeout-event-loop',
    title: 'setTimeout & Event Loop',
    category: 'async',
    description: 'setTimeout(fn, 0) doesn\'t run immediately! Watch the event loop in action.',
    code: `// setTimeout & Event Loop
console.log("1 - Start");

setTimeout(function() {
  console.log("2 - Timeout callback");
}, 0);

console.log("3 - End");

// Output: 1, 3, 2
// Even with 0ms delay, setTimeout waits
// for the call stack to be empty!`,
  },
  {
    id: 'promise-basics',
    title: 'Promise Basics',
    category: 'async',
    description: 'Promises and .then() — microtasks run before macrotasks.',
    code: `// Promise Basics
console.log("1 - Start");

let p = new Promise(function(resolve) {
  console.log("2 - Promise executor");
  resolve("done");
});

p.then(function(val) {
  console.log("3 - Then:", val);
});

console.log("4 - End");

// Output: 1, 2, 4, 3
// .then() goes to the microtask queue`,
  },
  {
    id: 'mixed-async',
    title: 'Mixed Async',
    category: 'async',
    description: 'The classic interview question: console.log + setTimeout + Promise ordering.',
    code: `// Mixed Async — predict the output!
console.log("1");

setTimeout(function() {
  console.log("2");
}, 0);

Promise.resolve().then(function() {
  console.log("3");
});

Promise.resolve().then(function() {
  console.log("4");
});

console.log("5");

// Output: 1, 5, 3, 4, 2
// Sync first, then microtasks, then macrotasks`,
  },
  {
    id: 'event-loop-deep-dive',
    title: 'Event Loop Deep Dive',
    category: 'async',
    description: 'Nested setTimeout + Promise — full macrotask vs microtask priority.',
    code: `// Event Loop Deep Dive
console.log("script start");

setTimeout(function() {
  console.log("setTimeout 1");
  Promise.resolve().then(function() {
    console.log("promise inside timeout");
  });
}, 0);

Promise.resolve().then(function() {
  console.log("promise 1");
}).then(function() {
  console.log("promise 2");
});

console.log("script end");

// script start, script end,
// promise 1, promise 2,
// setTimeout 1, promise inside timeout`,
  },
];

export default examples;
