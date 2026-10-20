// Comprehensive Starter Content for Real Placement & Interview Preparation.
// Each topic includes summary, key points, runnable code, real interview questions, and curated documentation links.

module.exports = [
  // ==========================================
  // 1. JAVASCRIPT MASTER CURRICULUM
  // ==========================================
  {
    name: "JavaScript",
    slug: "javascript",
    icon: "🟨",
    color: "#E8B93D",
    description: "Complete JavaScript curriculum from core execution mechanics to advanced design patterns and interview questions.",
    topics: [
      {
        title: "Variables, Scope, Hoisting & Temporal Dead Zone (TDZ)",
        summary: "JavaScript variables declared with var are function-scoped and hoisted with undefined. let and const are block-scoped and hoisted into the Temporal Dead Zone (TDZ), causing a ReferenceError if accessed before declaration.",
        keyPoints: [
          "Always prefer const by default; use let only when reassignment is needed; avoid var.",
          "Temporal Dead Zone (TDZ) is the time span between entering scope and variable declaration.",
          "var ignores block scopes (if, for), leading to accidental global pollution and closure bugs.",
          "const prevents re-binding of the identifier, but objects and arrays remain mutable."
        ],
        example: {
          language: "javascript",
          code: `console.log(a); // undefined (var hoisted)
var a = 10;

// console.log(b); // ReferenceError: Cannot access 'b' before initialization (TDZ)
let b = 20;

const arr = [1, 2];
arr.push(3); // Allowed: mutated
// arr = [4]; // TypeError: Assignment to constant variable`
        },
        interviewQuestions: [
          {
            question: "Why does `console.log(typeof x)` throw a ReferenceError if `let x = 10` is declared below it?",
            answer: "Because `let` and `const` variables are hoisted into the Temporal Dead Zone (TDZ). Inside the TDZ, any access (even `typeof`) throws a ReferenceError until the execution reaches the declaration line."
          },
          {
            question: "Explain the difference between undefined and undeclared in JavaScript.",
            answer: "`undefined` is a primitive value assigned to declared variables that haven't received a value. `undeclared` means the variable identifier was never declared in any accessible scope, throwing a ReferenceError upon access."
          }
        ],
        references: [
          { title: "MDN: var, let, and const", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let" },
          { title: "JavaScript.info: Variable Scope", url: "https://javascript.info/closure#lexical-environment" }
        ]
      },
      {
        title: "Closures & Lexical Scoping",
        summary: "A closure is the combination of a function bundled together with references to its surrounding lexical environment. Inner functions retain access to outer variables even after the outer function has completed execution.",
        keyPoints: [
          "Closures allow functions to maintain persistent private state without global variables.",
          "Heavily used in function factories, memoization, event handlers, and data privacy.",
          "Can cause memory leaks if outer variables are unnecessarily retained in long-lived references.",
          "In for-loops with asynchronous callbacks, var shares one variable while let creates a new binding per iteration."
        ],
        example: {
          language: "javascript",
          code: `function createBankAccount(initialBalance) {
  let balance = initialBalance; // Private variable enclosed in closure
  return {
    deposit: (amount) => (balance += amount),
    withdraw: (amount) => (amount <= balance ? (balance -= amount) : "Insufficient funds"),
    getBalance: () => balance
  };
}

const account = createBankAccount(100);
account.deposit(50);
console.log(account.getBalance()); // 150`
        },
        interviewQuestions: [
          {
            question: "What is the output of `for(var i=0; i<3; i++){ setTimeout(() => console.log(i), 100); }` and how do you fix it?",
            answer: "Output is `3, 3, 3` because `var` is function-scoped and all callbacks close over the same single variable `i`. Fix 1: Change `var i` to `let i` (creates a new block-scoped binding per iteration). Fix 2: Wrap in an IIFE closure."
          },
          {
            question: "How do closures enable the Module Pattern in JavaScript?",
            answer: "An IIFE creates a private scope for variables and helper functions, and returns an object exposing only selected public methods that close over the private variables."
          }
        ],
        references: [
          { title: "MDN: Closures", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures" },
          { title: "Frontend Interview Handbook: Closures", url: "https://www.frontendinterviewhandbook.com/javascript-questions#what-is-a-closure" }
        ]
      },
      {
        title: "Execution Context, Call Stack & Memory Heap",
        summary: "JavaScript executes code within Execution Contexts (Global and Function). Each context has a Creation Phase (allocating memory for variables and functions) and an Execution Phase (running line by line on the Call Stack).",
        keyPoints: [
          "Call Stack operates in LIFO (Last-In-First-Out) order to track function invocations.",
          "Memory Heap is an unstructured memory pool where objects, arrays, and functions are allocated.",
          "Stack Overflow happens when the call stack exceeds its recursion limit.",
          "Every execution context consists of: Variable Object/Lexical Environment, Scope Chain, and 'this' binding."
        ],
        example: {
          language: "javascript",
          code: `function first() {
  second();
  console.log("first done");
}
function second() {
  console.log("second running");
}
first();
// Call Stack trace:
// 1. push Global Context
// 2. push first()
// 3. push second() -> logs "second running" -> pop second()
// 4. logs "first done" -> pop first()`
        },
        interviewQuestions: [
          {
            question: "What happens during the Creation Phase of the Execution Context?",
            answer: "The JavaScript engine creates the global object (window in browser), sets up the 'this' reference, links the outer environment, and allocates memory for variable declarations (hoisting) before executing any line."
          }
        ],
        references: [
          { title: "MDN: JavaScript Execution Context", url: "https://developer.mozilla.org/en-US/docs/Glossary/Call_stack" },
          { title: "GeeksforGeeks: Execution Context", url: "https://www.geeksforgeeks.org/execution-context-in-javascript/" }
        ]
      },
      {
        title: "The 'this' Keyword, Call, Apply & Bind",
        summary: "In JavaScript, 'this' refers to the object currently executing the code. Its value depends on how a function is invoked (implicit, explicit, default, or 'new' binding), except in arrow functions which inherit 'this' lexically.",
        keyPoints: [
          "Default binding: in non-strict mode refers to global object/window; in strict mode is undefined.",
          "Implicit binding: `obj.method()` sets 'this' to `obj`.",
          "Explicit binding: `call(obj, arg1, arg2)`, `apply(obj, [args])`, and `bind(obj)` manually bind 'this'.",
          "Arrow functions do not have their own 'this', 'arguments', or 'super' bindings."
        ],
        example: {
          language: "javascript",
          code: `const developer = {
  name: "Nandini",
  greet: function(role, city) {
    return \`\${this.name} is a \${role} in \${city}\`;
  }
};

const other = { name: "Aarav" };

// call: arguments passed individually
console.log(developer.greet.call(other, "Fullstack Dev", "Bengaluru"));

// apply: arguments passed as array
console.log(developer.greet.apply(other, ["Cloud Architect", "Pune"]));

// bind: returns a new function with bound this
const boundGreet = developer.greet.bind(other, "Data Engineer");
console.log(boundGreet("Delhi"));`
        },
        interviewQuestions: [
          {
            question: "What is the difference between call(), apply(), and bind()?",
            answer: "`call()` invokes the function immediately with arguments passed individually. `apply()` invokes it immediately with arguments as an array. `bind()` returns a new permanent bound function without invoking it immediately."
          },
          {
            question: "Can you change 'this' in an arrow function using bind() or call()?",
            answer: "No. Arrow functions capture 'this' lexically from their enclosing scope at declaration time. Calling `bind`, `call`, or `apply` on an arrow function simply ignores the passed context."
          }
        ],
        references: [
          { title: "MDN: Function.prototype.bind()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind" },
          { title: "JavaScript.info: Function binding", url: "https://javascript.info/bind" }
        ]
      },
      {
        title: "Prototypes & Prototypal Inheritance",
        summary: "JavaScript uses prototypal inheritance instead of classical class-based inheritance. Every JavaScript object has an internal link (`[[Prototype]]` accessible via `__proto__` or `Object.getPrototypeOf`) pointing to its prototype object.",
        keyPoints: [
          "Property lookup travels up the prototype chain until found or reaches Object.prototype (null).",
          "Functions have a `.prototype` property used as the prototype for instances created with `new`.",
          "ES6 `class` syntax is syntactic sugar over prototypes and constructor functions.",
          "`Object.create(proto)` creates a new object with the specified prototype object."
        ],
        example: {
          language: "javascript",
          code: `function Person(name) {
  this.name = name;
}
Person.prototype.sayHi = function() {
  return \`Hi, I am \${this.name}\`;
};

const dev = new Person("Karan");
console.log(dev.sayHi()); // Found on Person.prototype
console.log(dev.hasOwnProperty("name")); // true (own property)
console.log(dev.hasOwnProperty("sayHi")); // false (inherited)`
        },
        interviewQuestions: [
          {
            question: "What is the difference between `__proto__` and `.prototype`?",
            answer: "`.prototype` is a property on constructor functions used to build `[[Prototype]]` of new instances. `__proto__` is an accessor property on objects pointing to the prototype object from which it inherits properties."
          }
        ],
        references: [
          { title: "MDN: Inheritance and prototype chain", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain" }
        ]
      },
      {
        title: "Event Loop, Microtasks & Macrotasks",
        summary: "JavaScript is single-threaded and non-blocking. The Event Loop continuously monitors the Call Stack. When the stack is empty, it flushes ALL microtasks (Promises, queueMicrotask) before processing ONE macrotask (setTimeout, setInterval).",
        keyPoints: [
          "Call Stack $\\rightarrow$ Microtask Queue $\\rightarrow$ Render/Repaint $\\rightarrow$ Macrotask Queue.",
          "Microtasks have higher priority and drain completely before any macrotask runs.",
          "Starvation can occur if recursive microtasks continuously block the event loop.",
          "Common interview order: synchronous code $\\rightarrow$ Promise.then $\\rightarrow$ setTimeout(0)."
        ],
        example: {
          language: "javascript",
          code: `console.log("1: Sync");

setTimeout(() => {
  console.log("2: Macrotask (setTimeout)");
}, 0);

Promise.resolve().then(() => {
  console.log("3: Microtask (Promise)");
});

console.log("4: Sync");
// Output order: 1 -> 4 -> 3 -> 2`
        },
        interviewQuestions: [
          {
            question: "Why does Promise.then execute before setTimeout(fn, 0)?",
            answer: "Because Promise callbacks are queued in the Microtask Queue, while setTimeout callbacks go into the Macrotask (Callback) Queue. The Event Loop prioritizes draining the entire Microtask Queue before running the next Macrotask."
          }
        ],
        references: [
          { title: "MDN: In-depth Event Loop", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop" },
          { title: "JavaScript.info: Event loop: microtasks and macrotasks", url: "https://javascript.info/event-loop" }
        ]
      },
      {
        title: "Promises, Async/Await & Concurrency Patterns",
        summary: "Promises represent eventual completion or failure of asynchronous operations. async/await provides synchronous-looking syntax over Promises with standard try/catch error handling.",
        keyPoints: [
          "Promise states: pending, fulfilled, rejected (settled once and immutable).",
          "`Promise.all` runs in parallel and rejects fast if any fails.",
          "`Promise.allSettled` waits for all to settle regardless of rejection.",
          "`Promise.race` settles with the first settled promise; `Promise.any` with the first fulfilled.",
          "await only pauses the surrounding async function, never blocking the main thread."
        ],
        example: {
          language: "javascript",
          code: `async function fetchUserData(userId) {
  try {
    const [profile, posts] = await Promise.all([
      fetch(\`/api/users/\${userId}\`).then(r => r.json()),
      fetch(\`/api/users/\${userId}/posts\`).then(r => r.json())
    ]);
    return { profile, posts };
  } catch (err) {
    console.error("Failed to load user:", err.message);
    throw err;
  }
}`
        },
        interviewQuestions: [
          {
            question: "What is the difference between `Promise.all` and `Promise.allSettled`?",
            answer: "`Promise.all` fails immediately (short-circuits) if any promise rejects. `Promise.allSettled` waits for all promises to finish and returns an array of objects indicating the status ('fulfilled' or 'rejected') and value/reason of each."
          }
        ],
        references: [
          { title: "MDN: Promise.allSettled()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled" }
        ]
      },
      {
        title: "DOM Manipulation & Event Bubbling/Capturing",
        summary: "Events in the DOM propagate in three phases: Capturing phase (window to target), Target phase, and Bubbling phase (target up to window). Event Delegation leverages bubbling to handle events efficiently.",
        keyPoints: [
          "`event.stopPropagation()` stops the event from traversing further up or down the DOM.",
          "`event.preventDefault()` prevents the default browser action (e.g., form submit refresh).",
          "Event Delegation attaches a single listener to a parent element rather than many child elements.",
          "Pass `{ capture: true }` in `addEventListener` to listen during the capturing phase."
        ],
        example: {
          language: "javascript",
          code: `// Event Delegation on a list parent
document.getElementById("todo-list").addEventListener("click", (e) => {
  if (e.target.matches("button.delete")) {
    const li = e.target.closest("li");
    li.remove();
  }
});`
        },
        interviewQuestions: [
          {
            question: "What is Event Delegation and why is it preferred for dynamic lists?",
            answer: "Event Delegation places a single event listener on a parent container to manage events triggered by existing or future child elements using bubbling. It saves memory and avoids attaching/removing listeners when elements are dynamically added."
          }
        ],
        references: [
          { title: "MDN: Event Bubbling and Capture", url: "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#event_bubbling" }
        ]
      },
      {
        title: "Debouncing, Throttling & Performance",
        summary: "Debouncing and Throttling limit the rate at which a function executes. Debouncing delays execution until a quiet period passes (e.g., search autocomplete), while Throttling ensures execution at most once every interval (e.g., scroll/resize).",
        keyPoints: [
          "Debounce: executes after N milliseconds of inactivity since the last event.",
          "Throttle: guarantees execution once every N milliseconds during continuous activity.",
          "Critical for performance: prevents browser freezing during scroll, resize, and keyup events.",
          "`requestAnimationFrame` is an optimal throttle specifically for UI paint animations (60fps)."
        ],
        example: {
          language: "javascript",
          code: `function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function throttle(fn, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}`
        },
        interviewQuestions: [
          {
            question: "When should you use Debounce vs Throttle in a real application?",
            answer: "Use Debounce when you only care about the final state after the user pauses (e.g., search typeahead, auto-saving form). Use Throttle when you need regular intermediate updates while the user is actively acting (e.g., infinite scroll, window resize, game loop)."
          }
        ],
        references: [
          { title: "CSS-Tricks: Debouncing and Throttling", url: "https://css-tricks.com/debouncing-throttling-explained-examples/" }
        ]
      },
      {
        title: "Web Storage: LocalStorage, SessionStorage & Cookies",
        summary: "Browsers provide client-side storage mechanisms with different lifespans, capacities, and network transmission behaviors.",
        keyPoints: [
          "LocalStorage: ~5-10MB, persists across sessions until explicitly cleared, synchronous API.",
          "SessionStorage: ~5MB, cleared when the browser tab/window is closed, tab-isolated.",
          "Cookies: ~4KB, sent automatically with every HTTP request; support HttpOnly and Secure flags.",
          "IndexedDB: transactional, asynchronous NoSQL database inside the browser for large structured data (>50MB)."
        ],
        example: {
          language: "javascript",
          code: `// LocalStorage API
localStorage.setItem("theme", "dark");
const theme = localStorage.getItem("theme");

// Storing objects requires JSON serialization
localStorage.setItem("user", JSON.stringify({ name: "Nandini", role: "Dev" }));
const user = JSON.parse(localStorage.getItem("user") || "{}");`
        },
        interviewQuestions: [
          {
            question: "Why should you NOT store sensitive JWT authentication tokens in localStorage?",
            answer: "LocalStorage is vulnerable to Cross-Site Scripting (XSS) attacks. Any injected script can read `localStorage.getItem('token')`. Storing authentication tokens in `HttpOnly, Secure, SameSite` cookies prevents JavaScript access and protects against XSS."
          }
        ],
        references: [
          { title: "MDN: Web Storage API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API" }
        ]
      },
      {
        title: "ES6+ Modern Features: Modules, Generators & Proxies",
        summary: "Modern JavaScript includes ES Modules (`import`/`export`), Generators (`function*` and `yield`), Proxies, and Reflect API for meta-programming and reactivity.",
        keyPoints: [
          "ES Modules are static, asynchronous, and support tree-shaking.",
          "Generators produce iterators that can pause and resume execution, ideal for streaming.",
          "Proxies intercept and customize fundamental operations (get, set, deleteProperty) on objects.",
          "Vue 3 reactivity is built entirely on JavaScript Proxies."
        ],
        example: {
          language: "javascript",
          code: `// Proxy for validation and reactivity
const handler = {
  set(target, key, value) {
    if (key === "age" && (typeof value !== "number" || value < 0)) {
      throw new TypeError("Invalid age");
    }
    target[key] = value;
    return true;
  }
};

const person = new Proxy({}, handler);
person.age = 23; // works
// person.age = -5; // Throws TypeError: Invalid age`
        },
        interviewQuestions: [
          {
            question: "What is the difference between CommonJS and ES Modules?",
            answer: "CommonJS (`require`/`module.exports`) is synchronous and dynamic (evaluates at runtime). ES Modules (`import`/`export`) are asynchronous, static (analyzed at compile-time enabling tree-shaking), and support top-level await."
          }
        ],
        references: [
          { title: "MDN: Proxy", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy" }
        ]
      },
      {
        title: "Memory Leaks & V8 Garbage Collection",
        summary: "V8 manages memory using Generational Garbage Collection (Young Generation Scavenge and Old Generation Mark-Sweep-Compact). Understanding common memory leak patterns is vital for senior developer interviews.",
        keyPoints: [
          "Reachability: objects reachable from roots (global variables, call stack) are kept alive.",
          "Accidental global variables (`this.name = ...` in non-strict mode) are never garbage collected.",
          "Forgotten timers (`setInterval`) retain closures and all referenced objects.",
          "Detached DOM trees occur when DOM elements are removed from page but held in JS variables."
        ],
        example: {
          language: "javascript",
          code: `// Common leak: Forgotten timer
function startTracking() {
  const largeData = new Array(1000000).fill("data");
  const timer = setInterval(() => {
    // largeData is retained in memory by closure as long as timer runs
    console.log("tick");
  }, 1000);
  
  // Cleanup pattern:
  return () => clearInterval(timer);
}`
        },
        interviewQuestions: [
          {
            question: "What are the 3 most common causes of memory leaks in single-page JavaScript applications?",
            answer: "1. Uncleaned event listeners and intervals (`setInterval`/window events on unmounted components). 2. Detached DOM nodes referenced in JavaScript arrays/objects. 3. Unintended global variables and closures holding large scopes."
          }
        ],
        references: [
          { title: "V8: Trash talk - Garbage Collection", url: "https://v8.dev/blog/trash-talk" }
        ]
      }
    ]
  },

  // ==========================================
  // 2. PYTHON MASTER CURRICULUM
  // ==========================================
  {
    name: "Python",
    slug: "python",
    icon: "🐍",
    color: "#4B8BBE",
    description: "In-depth Python curriculum covering the GIL, memory model, generators, decorators, OOP internals, asyncio, and placement interview questions.",
    topics: [
      {
        title: "Python Memory Model & The Global Interpreter Lock (GIL)",
        summary: "CPython uses reference counting combined with a cyclic garbage collector. The Global Interpreter Lock (GIL) is a mutex that protects access to Python objects, preventing multiple native threads from executing Python bytecodes simultaneously.",
        keyPoints: [
          "Reference counting deallocates memory immediately when ref count drops to zero.",
          "Cyclic GC (generational: Gen 0, 1, 2) handles circular references.",
          "The GIL restricts CPU-bound multithreading to a single core in CPython.",
          "Use the `multiprocessing` module or C-extensions to bypass the GIL for CPU-bound tasks."
        ],
        example: {
          language: "python",
          code: `import sys

a = [1, 2, 3]
b = a
print(sys.getrefcount(a)) # 3 (a, b, and argument to getrefcount)
del b
print(sys.getrefcount(a)) # 2`
        },
        interviewQuestions: [
          {
            question: "Why does Python have a GIL if it limits multithreaded CPU performance?",
            answer: "The GIL was introduced in CPython to make memory management thread-safe without needing fine-grained locks on every single object (which would severely slow down single-threaded performance) and to simplify C-extension integration."
          }
        ],
        references: [
          { title: "Real Python: What is the Python GIL?", url: "https://realpython.com/python-gil/" }
        ]
      },
      {
        title: "Iterables, Iterators & Generators (`yield`)",
        summary: "An iterable implements `__iter__()`. An iterator implements `__next__()`. Generators are functions that use the `yield` keyword to produce values lazily on-demand, saving vast amounts of memory.",
        keyPoints: [
          "Generators maintain execution state between `yield` expressions.",
          "`StopIteration` exception is raised when no more items exist in an iterator.",
          "Generator expressions `(x for x in data)` evaluate lazily compared to list comprehensions `[x for x in data]`.",
          "Essential for processing large datasets, logs, and infinite sequences."
        ],
        example: {
          language: "python",
          code: `def fibonacci_gen(limit):
    a, b = 0, 1
    for _ in range(limit):
        yield a
        a, b = b, a + b

# Evaluated lazily in constant O(1) memory
fib = fibonacci_gen(5)
for num in fib:
    print(num, end=" ") # 0 1 1 2 3`
        },
        interviewQuestions: [
          {
            question: "What is the difference between `yield` and `return`?",
            answer: "`return` terminates function execution and returns a value. `yield` pauses the function, saves its local state (variables and instruction pointer), and yields a value, resuming from that exact spot on the next `next()` call."
          }
        ],
        references: [
          { title: "Python Docs: Generators", url: "https://docs.python.org/3/howto/functional.html#generators" }
        ]
      },
      {
        title: "Decorators & Function Wrappers",
        summary: "Decorators are callables that accept a function as an argument and return an enhanced function without modifying the original source code. Widely used for logging, authentication, caching, and rate limiting.",
        keyPoints: [
          "Uses `@decorator_name` syntax over function definitions.",
          "Always use `functools.wraps` to preserve the original function's name and docstring.",
          "Decorators can accept arguments by wrapping the decorator in another outer function.",
          "Class decorators can decorate entire classes to modify attributes or methods."
        ],
        example: {
          language: "python",
          code: `from functools import wraps
import time

def timing_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        duration = time.perf_counter() - start
        print(f"{func.__name__} took {duration:.4f}s")
        return result
    return wrapper

@timing_decorator
def calculate_squares(n):
    return [i ** 2 for i in range(n)]

calculate_squares(100000)`
        },
        interviewQuestions: [
          {
            question: "Why should you always use `functools.wraps` inside a custom decorator?",
            answer: "Without `functools.wraps`, the decorated function loses its identity (its `__name__`, `__doc__`, and module attributes become those of the inner `wrapper` function), which breaks introspection, debugging, and documentation tools."
          }
        ],
        references: [
          { title: "Real Python: Primer on Python Decorators", url: "https://realpython.com/primer-on-python-decorators/" }
        ]
      },
      {
        title: "OOP: Dunder Methods, MRO & Multiple Inheritance",
        summary: "Python objects are customized through magic (dunder) methods such as `__init__`, `__repr__`, `__str__`, `__eq__`, and `__len__`. Multiple inheritance uses the C3 Linearization algorithm to determine Method Resolution Order (MRO).",
        keyPoints: [
          "MRO dictates the order in which base classes are searched when calling a method via `super()`.",
          "`__repr__` is meant for unambiguous developer debugging; `__str__` is for end-user readability.",
          "`__slots__` restricts dynamic attribute creation and significantly reduces memory overhead.",
          "`super()` properly follows the MRO in diamond inheritance structures."
        ],
        example: {
          language: "python",
          code: `class Vector:
    __slots__ = ('x', 'y') # Optimizes memory by avoiding __dict__
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __add__(self, other):
        return Vector(self.x + other.x, self.y + other.y)

    def __repr__(self):
        return f"Vector({self.x}, {self.y})"

v1 = Vector(2, 4)
v2 = Vector(3, 1)
print(v1 + v2) # Vector(5, 5)`
        },
        interviewQuestions: [
          {
            question: "How does Python resolve method calls in multiple inheritance with the Diamond Problem?",
            answer: "Python uses the C3 Linearization algorithm to calculate the Method Resolution Order (`Class.__mro__`). It guarantees monotonic inheritance: subclasses precede parents, and declared order of parents is preserved."
          }
        ],
        references: [
          { title: "Python Docs: Method Resolution Order", url: "https://www.python.org/download/releases/2.3/mro/" }
        ]
      },
      {
        title: "Context Managers & The 'with' Statement",
        summary: "Context managers facilitate the allocation and guaranteed cleanup of resources (file handles, database connections, locks) using `__enter__` and `__exit__` protocols or `@contextlib.contextmanager`.",
        keyPoints: [
          "`__enter__` sets up the resource and optionally binds to the `as` variable.",
          "`__exit__` is guaranteed to execute even if an unhandled exception occurs inside the block.",
          "Prevents resource exhaustion bugs (e.g., file descriptor leaks).",
          "`contextlib.contextmanager` lets you convert generator functions with a single yield into context managers."
        ],
        example: {
          language: "python",
          code: `from contextlib import contextmanager

@contextmanager
def open_managed_file(filename, mode):
    f = open(filename, mode)
    try:
        yield f
    finally:
        f.close()
        print("File closed successfully")`
        },
        interviewQuestions: [
          {
            question: "How can you suppress exceptions inside a context manager's `__exit__` method?",
            answer: "By returning `True` from `__exit__(self, exc_type, exc_val, exc_tb)`. If `__exit__` returns `True`, Python swallows the exception and continues execution after the `with` block."
          }
        ],
        references: [
          { title: "Python Docs: contextlib", url: "https://docs.python.org/3/library/contextlib.html" }
        ]
      },
      {
        title: "Multiprocessing vs Multithreading vs Asyncio",
        summary: "Choosing the correct concurrency model is a staple senior interview topic: threading for I/O bound tasks, multiprocessing for CPU bound tasks, and asyncio for high-concurrency network operations.",
        keyPoints: [
          "Threading: shared memory, lightweight, constrained by GIL for CPU tasks.",
          "Multiprocessing: separate process, separate Python interpreter & GIL, separate memory space, inter-process communication overhead.",
          "Asyncio: single-threaded cooperative multitasking using an event loop with async/await.",
          "Use `concurrent.futures` for clean thread/process pool interfaces."
        ],
        example: {
          language: "python",
          code: `import asyncio

async def fetch_api(url, delay):
    await asyncio.sleep(delay)
    return f"Response from {url}"

async def main():
    results = await asyncio.gather(
        fetch_api("api/users", 1),
        fetch_api("api/products", 1)
    )
    print(results)

# asyncio.run(main())`
        },
        interviewQuestions: [
          {
            question: "When would you choose `asyncio` over `threading` in Python?",
            answer: "When managing thousands of concurrent I/O-bound network connections (e.g., chat servers, web scrapers). Threads consume OS stack memory (8MB each) and context switching overhead; asyncio coroutines are ultra-lightweight (kilobytes) and handle tens of thousands on a single thread."
          }
        ],
        references: [
          { title: "Real Python: Async IO in Python", url: "https://realpython.com/async-io-python/" }
        ]
      }
    ]
  },

  // ==========================================
  // 3. DBMS (DATABASE MANAGEMENT SYSTEMS)
  // ==========================================
  {
    name: "DBMS",
    slug: "dbms",
    icon: "🗄️",
    color: "#6EA88B",
    description: "Comprehensive Database Management Systems curriculum: SQL, Normalization, ACID, Indexing, Transactions, Concurrency, and Placement Interview Prep.",
    topics: [
      {
        title: "Relational Model, Keys & Integrity Constraints",
        summary: "The Relational Model organizes data into tables (relations) of rows (tuples) and columns (attributes). Keys uniquely identify records and establish referential integrity between tables.",
        keyPoints: [
          "Super Key: any set of attributes that uniquely identifies a row.",
          "Candidate Key: minimal Super Key with no redundant attributes.",
          "Primary Key: chosen candidate key; cannot contain NULL values.",
          "Foreign Key: attribute referencing a Primary Key in another table, enforcing referential integrity."
        ],
        example: {
          language: "sql",
          code: `CREATE TABLE departments (
    dept_id INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE employees (
    emp_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    dept_id INT,
    FOREIGN KEY (dept_id) REFERENCES departments(dept_id) ON DELETE SET NULL
);`
        },
        interviewQuestions: [
          {
            question: "What is the difference between Primary Key and Unique Key?",
            answer: "1. A table can have only ONE Primary Key, but multiple Unique keys. 2. Primary Key does NOT accept NULL values; Unique key allows one (or multiple in some SQL engines) NULL value. 3. Primary Key automatically creates a clustered index by default."
          }
        ],
        references: [
          { title: "GeeksforGeeks: Types of Keys in DBMS", url: "https://www.geeksforgeeks.org/types-of-keys-in-relational-model-candidate-super-primary-alternate-and-foreign/" }
        ]
      },
      {
        title: "SQL Joins & Complex Subqueries",
        summary: "Joins combine columns from one or more tables based on related columns. Understanding INNER, LEFT, RIGHT, FULL OUTER, and CROSS joins is essential for placement rounds.",
        keyPoints: [
          "INNER JOIN: returns rows where matches exist in both tables.",
          "LEFT JOIN: returns all rows from the left table and matched rows from the right table.",
          "CROSS JOIN: returns the Cartesian product ($M \\times N$ rows).",
          "Correlated Subquery: inner query references columns from the outer query and executes once per outer row."
        ],
        example: {
          language: "sql",
          code: `-- Find employees earning more than their department's average salary
SELECT e.name, e.salary, e.dept_id
FROM employees e
WHERE e.salary > (
    SELECT AVG(salary)
    FROM employees
    WHERE dept_id = e.dept_id
);`
        },
        interviewQuestions: [
          {
            question: "How do you find the N-th highest salary in SQL?",
            answer: "Using DENSE_RANK(): `SELECT salary FROM (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) as rank FROM employees) WHERE rank = N;` Or using LIMIT/OFFSET: `SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET N-1;`"
          }
        ],
        references: [
          { title: "W3Schools: SQL Joins", url: "https://www.w3schools.com/sql/sql_join.asp" }
        ]
      },
      {
        title: "Database Normalization (1NF, 2NF, 3NF, BCNF)",
        summary: "Normalization is the process of organizing database relations to minimize redundancy and prevent insertion, update, and deletion anomalies.",
        keyPoints: [
          "1NF: atomic values (no multivalued/composite attributes), unique column names.",
          "2NF: in 1NF + no partial dependency (every non-prime attribute is fully functionally dependent on the entire candidate key).",
          "3NF: in 2NF + no transitive dependency (non-prime attribute should not determine another non-prime attribute).",
          "BCNF: in 3NF + for every functional dependency $X \\rightarrow Y$, $X$ must be a Super Key."
        ],
        example: {
          language: "sql",
          code: `-- Denormalized table with anomalies:
-- Student_Course(student_id, student_name, course_id, course_name)
-- If course name changes, multiple rows must be updated (Update Anomaly)

-- Normalized into 3NF:
-- Students(student_id, student_name)
-- Courses(course_id, course_name)
-- Student_Enrollment(student_id, course_id)`
        },
        interviewQuestions: [
          {
            question: "When would you intentionally denormalize a database?",
            answer: "In read-heavy analytics and data warehouse systems (OLAP). Normalization increases the number of JOINs required to read data. Denormalization trades redundant storage and write overhead for significantly faster read queries."
          }
        ],
        references: [
          { title: "GeeksforGeeks: Database Normalization", url: "https://www.geeksforgeeks.org/database-normalization-introduction/" }
        ]
      },
      {
        title: "ACID Properties & Transaction States",
        summary: "A transaction is a logical unit of database processing. ACID properties ensure reliability and data consistency during failures and concurrent executions.",
        keyPoints: [
          "Atomicity: 'All or nothing' execution. Managed by write-ahead logging (WAL) and rollback.",
          "Consistency: Database transitions only from one valid state to another, satisfying all constraints.",
          "Isolation: Concurrent transactions execute without interfering with each other.",
          "Durability: Committed data is guaranteed to survive power outages or system crashes."
        ],
        example: {
          language: "sql",
          code: `BEGIN TRANSACTION;
UPDATE accounts SET balance = balance - 500 WHERE account_id = 101;
UPDATE accounts SET balance = balance + 500 WHERE account_id = 202;

-- If both succeed:
COMMIT;
-- If any error occurs:
-- ROLLBACK;`
        },
        interviewQuestions: [
          {
            question: "How does Write-Ahead Logging (WAL) guarantee Atomicity and Durability?",
            answer: "WAL ensures that changes are written to persistent non-volatile log storage before the actual database pages are updated on disk. Upon crash, uncommitted transactions are rolled back (undo) and committed transactions are applied (redo)."
          }
        ],
        references: [
          { title: "GeeksforGeeks: ACID Properties", url: "https://www.geeksforgeeks.org/acid-properties-in-dbms/" }
        ]
      },
      {
        title: "Indexing: B-Trees, B+ Trees & Hash Indexes",
        summary: "Indexes are auxiliary data structures that accelerate record retrieval at the expense of slower writes and extra storage space. Relational databases predominantly use B+ Trees.",
        keyPoints: [
          "B+ Tree stores all data pointers only in leaf nodes; internal nodes only store routing keys.",
          "Leaf nodes are doubly linked, making range scans (`BETWEEN`, `>`, `<`) exceptionally fast.",
          "Clustered Index determines physical storage order of rows (only 1 per table).",
          "Non-Clustered (Secondary) Index contains a pointer to the clustered index key or row ID."
        ],
        example: {
          language: "sql",
          code: `-- Create a composite index for fast lookups by status and date
CREATE INDEX idx_orders_status_date ON orders(status, order_date);

-- Check query plan using EXPLAIN
EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'SHIPPED' AND order_date >= '2026-01-01';`
        },
        interviewQuestions: [
          {
            question: "Why do relational databases use B+ Trees instead of Binary Search Trees for indexes?",
            answer: "B+ Trees have high fan-out (many keys per node), resulting in very low tree height (typically 3-4 levels for millions of rows). This drastically minimizes slow disk I/O seeks compared to BSTs. Also, doubly-linked leaf nodes enable $O(1)$ sequential range scans."
          }
        ],
        references: [
          { title: "Use The Index, Luke! SQL Indexing Guide", url: "https://use-the-index-luke.com/" }
        ]
      },
      {
        title: "Concurrency Control, Isolation Levels & Deadlocks",
        summary: "To prevent read anomalies when multiple transactions execute concurrently, SQL engines support four isolation levels: Read Uncommitted, Read Committed, Repeatable Read, and Serializable.",
        keyPoints: [
          "Dirty Read: reading uncommitted changes made by another transaction.",
          "Non-Repeatable Read: reading different values for the same row within a transaction.",
          "Phantom Read: new rows inserted by another transaction appear in subsequent range queries.",
          "Two-Phase Locking (2PL): Growing phase (acquire locks) followed by Shrinking phase (release locks)."
        ],
        example: {
          language: "sql",
          code: `-- Setting transaction isolation level in PostgreSQL / MySQL
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN;
SELECT balance FROM accounts WHERE account_id = 1;
-- Guarantees repeatable reads until commit
COMMIT;`
        },
        interviewQuestions: [
          {
            question: "What is the difference between Read Committed and Repeatable Read isolation levels?",
            answer: "Read Committed prevents Dirty Reads by reading only committed data, but the same query run twice can return different values if another transaction updates and commits. Repeatable Read prevents Non-Repeatable Reads by ensuring a transaction sees a snapshot of the data as of transaction start."
          }
        ],
        references: [
          { title: "PostgreSQL Docs: Transaction Isolation", url: "https://www.postgresql.org/docs/current/transaction-iso.html" }
        ]
      }
    ]
  },

  // ==========================================
  // 4. OPERATING SYSTEMS (OS)
  // ==========================================
  {
    name: "Operating Systems",
    slug: "operating-systems",
    icon: "💻",
    color: "#5B9BD5",
    description: "Core Operating Systems curriculum: Processes, Threads, CPU Scheduling, Deadlocks, Memory Management, Paging, and Interview Problems.",
    topics: [
      {
        title: "Process vs Thread, PCB & Context Switching",
        summary: "A process is a program in execution with its own virtual address space. A thread is a lightweight unit of execution within a process that shares code, data, and open files with sibling threads but has its own stack and registers.",
        keyPoints: [
          "Process Control Block (PCB) stores PID, state, PC, registers, and open file pointers.",
          "Context switching saves the CPU state of the active process and loads the state of the scheduled process.",
          "Thread switching is much faster than process switching because it does not invalidate virtual memory page caches (TLB).",
          "Inter-thread communication is faster (shared memory) but requires synchronization primitives."
        ],
        example: {
          language: "c",
          code: `// Process creation with fork() in C / POSIX
#include <stdio.h>
#include <unistd.h>

int main() {
    pid_t pid = fork();
    if (pid == 0) {
        printf("Child Process: PID = %d\\n", getpid());
    } else if (pid > 0) {
        printf("Parent Process: Child PID = %d\\n", pid);
    }
    return 0;
}`
        },
        interviewQuestions: [
          {
            question: "What happens during a CPU context switch between two processes?",
            answer: "1. The CPU switches to kernel mode. 2. Current CPU registers, Program Counter, and stack pointers are saved to the current process's PCB. 3. The scheduler selects the next process. 4. Memory management registers (CR3 in x86) are updated, which flushes the TLB cache. 5. Next process's registers are restored and execution resumes."
          }
        ],
        references: [
          { title: "OSTEP: Virtualizing the CPU", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-intro.pdf" }
        ]
      },
      {
        title: "CPU Scheduling Algorithms",
        summary: "The CPU scheduler allocates CPU time among ready processes to maximize throughput, minimize latency, and ensure fairness.",
        keyPoints: [
          "Preemptive vs Non-Preemptive scheduling.",
          "FCFS (First-Come, First-Served): simple, suffers from Convoy Effect.",
          "SJF (Shortest Job First): provably optimal for average waiting time, but suffers from starvation of long jobs.",
          "Round Robin (RR): preemptive with fixed time quantum $q$; balance between fairness and response time."
        ],
        example: {
          language: "text",
          code: `Process Arrival Burst
P1      0       5
P2      1       3
P3      2       8

Round Robin (Quantum = 2):
Gantt Chart: | P1 (2) | P2 (2) | P3 (2) | P1 (2) | P2 (1) | P1 (1) | P3 (6) |`
        },
        interviewQuestions: [
          {
            question: "What is the Convoy Effect in FCFS scheduling?",
            answer: "The Convoy Effect occurs when a CPU-bound process with a huge burst time holds the CPU, while multiple I/O-bound processes with tiny burst times wait behind it in the ready queue, causing very poor CPU and device utilization."
          }
        ],
        references: [
          { title: "GeeksforGeeks: CPU Scheduling in Operating Systems", url: "https://www.geeksforgeeks.org/cpu-scheduling-in-operating-systems/" }
        ]
      },
      {
        title: "Process Synchronization: Mutex, Semaphores & Critical Section",
        summary: "When multiple processes access shared resources concurrently, race conditions arise. Synchronization primitives ensure Mutual Exclusion, Progress, and Bounded Waiting.",
        keyPoints: [
          "Critical Section is the code block accessing shared mutable state.",
          "Mutex (Mutual Exclusion Lock): binary lock with ownership; only the thread that locks can unlock.",
          "Semaphore: integer variable accessed via atomic `wait()` (P) and `signal()` (V) operations.",
          "Counting Semaphore manages access to a finite pool of identical resources."
        ],
        example: {
          language: "c",
          code: `#include <pthread.h>
pthread_mutex_t lock;
int counter = 0;

void* worker(void* arg) {
    pthread_mutex_lock(&lock);
    counter++; // Critical Section
    pthread_mutex_unlock(&lock);
    return NULL;
}`
        },
        interviewQuestions: [
          {
            question: "What is the difference between a Mutex and a Binary Semaphore?",
            answer: "A Mutex has the concept of ownership: only the thread that locked it can unlock it. A Semaphore has no ownership: any thread or interrupt handler can call `signal()` to unblock a waiting thread. Semaphores are for signaling; Mutexes are for mutual exclusion."
          }
        ],
        references: [
          { title: "OSTEP: Semaphores", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/threads-sema.pdf" }
        ]
      },
      {
        title: "Deadlocks: 4 Conditions, Detection & Prevention",
        summary: "A deadlock is a state where a set of processes are blocked because each process holds a resource and waits for another resource held by another process in the set.",
        keyPoints: [
          "Coffman's 4 Necessary Conditions: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait.",
          "Deadlock Prevention invalidates at least one of the 4 conditions (e.g., impose strict global resource ordering).",
          "Deadlock Avoidance uses Banker's Algorithm to check if granting a resource keeps the system in a Safe State.",
          "Deadlock Detection & Recovery terminates processes or preempts resources using Resource Allocation Graphs (RAG)."
        ],
        example: {
          language: "text",
          code: `Banker's Algorithm Safety Check:
Available Resources = [3, 3, 2]
Check if Need <= Available for each process.
If yes, process can finish and return its Allocation to Available.
Find a safe sequence (e.g., <P1, P3, P0, P2, P4>).`
        },
        interviewQuestions: [
          {
            question: "How do you prevent Deadlock by breaking the Circular Wait condition?",
            answer: "By assigning a global numerical ordering to all system resources. Require that any process can only request resources in strictly increasing numerical order. This mathematically prevents the formation of a directed cycle in the Resource Allocation Graph."
          }
        ],
        references: [
          { title: "GeeksforGeeks: Banker's Algorithm", url: "https://www.geeksforgeeks.org/bankers-algorithm-in-operating-system-2/" }
        ]
      },
      {
        title: "Memory Management, Paging & Translation Lookaside Buffer (TLB)",
        summary: "Paging is a memory management scheme that eliminates external fragmentation by dividing physical memory into fixed-size frames and virtual memory into pages. The Memory Management Unit (MMU) uses page tables and TLBs to translate addresses.",
        keyPoints: [
          "Virtual Address consists of: Page Number ($p$) and Page Offset ($d$).",
          "Translation Lookaside Buffer (TLB) is a fast hardware associative cache for page table translations.",
          "TLB Hit avoids accessing main memory twice for a single variable read.",
          "Multi-level Page Tables reduce memory overhead by only allocating page tables for active virtual memory regions."
        ],
        example: {
          language: "text",
          code: `Virtual Address (32-bit):
| Page Number: 20 bits | Offset: 12 bits (4KB page size) |

Address translation:
1. Check TLB for Page Number.
   - TLB Hit: Frame Number obtained in 1 CPU cycle.
   - TLB Miss: Lookup Page Table in RAM, load into TLB, fetch data.`
        },
        interviewQuestions: [
          {
            question: "What is the difference between Internal and External Fragmentation?",
            answer: "External Fragmentation occurs when total free memory exists to satisfy a request, but it is non-contiguous and cannot be allocated. Internal Fragmentation occurs when allocated memory blocks are slightly larger than requested data (e.g., unused space inside a 4KB page)."
          }
        ],
        references: [
          { title: "OSTEP: Paging", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf" }
        ]
      },
      {
        title: "Virtual Memory & Page Replacement Algorithms",
        summary: "Virtual memory enables execution of processes that exceed physical memory capacity through demand paging. When a page fault occurs and no free frames exist, page replacement algorithms evict an existing page.",
        keyPoints: [
          "Page Fault interrupt triggers when a requested page is not in physical RAM (present bit = 0).",
          "FIFO (First-In-First-Out): simple, but suffers from Belady's Anomaly.",
          "LRU (Least Recently Used): replaces page unreferenced for the longest time.",
          "Thrashing occurs when the system spends more time swapping pages in/out of disk than executing code."
        ],
        example: {
          language: "text",
          code: `Reference String: 7, 0, 1, 2, 0, 3, 0, 4, 2, 3
3 Frames using LRU:
Page 7: [7]       - Fault
Page 0: [7, 0]    - Fault
Page 1: [7, 0, 1] - Fault
Page 2: [2, 0, 1] - Fault (7 evicted, least recently used)`
        },
        interviewQuestions: [
          {
            question: "What is Belady's Anomaly and which algorithm suffers from it?",
            answer: "Belady's Anomaly is the counter-intuitive phenomenon where increasing the number of allocated physical page frames actually increases the number of page faults. It occurs in FIFO page replacement, but cannot occur in stack-based algorithms like LRU or Optimal."
          }
        ],
        references: [
          { title: "GeeksforGeeks: Page Replacement Algorithms", url: "https://www.geeksforgeeks.org/page-replacement-algorithms-in-operating-systems/" }
        ]
      }
    ]
  },

  // ==========================================
  // 5. DATA STRUCTURES & ALGORITHMS (DSA)
  // ==========================================
  {
    name: "DSA",
    slug: "dsa",
    icon: "🧮",
    color: "#E07A5F",
    description: "Complete Data Structures & Algorithms interview curriculum: Complexity, Two Pointers, Linked Lists, Trees, Graphs, DP, and standard placement patterns.",
    topics: [
      {
        title: "Asymptotic Analysis: Big-O, Big-Omega & Master Theorem",
        summary: "Asymptotic notation formally describes the mathematical performance and memory scaling of algorithms as input size $N$ approaches infinity.",
        keyPoints: [
          "Big-O ($O$): tight upper bound (worst-case performance).",
          "Big-Omega ($\\Omega$): lower bound (best-case performance).",
          "Big-Theta ($\\Theta$): tight exact bound (both upper and lower bound match).",
          "Master Theorem solves divide-and-conquer recurrences: $T(n) = aT(n/b) + f(n)$."
        ],
        example: {
          language: "javascript",
          code: `// O(1) Constant: Array access
const x = arr[0];

// O(log N) Logarithmic: Binary Search
function binarySearch(arr, target) {
  let l = 0, r = arr.length - 1;
  while (l <= r) {
    const mid = Math.floor((l + r) / 2);
    if (arr[mid] === target) return mid;
    arr[mid] < target ? (l = mid + 1) : (r = mid - 1);
  }
  return -1;
}`
        },
        interviewQuestions: [
          {
            question: "Why is MergeSort guaranteed $O(N \\log N)$ while QuickSort is $O(N^2)$ in the worst case?",
            answer: "MergeSort always divides the array into two equal halves ($2T(N/2) + O(N)$), yielding $O(N \\log N)$ every time. QuickSort partitions around a pivot; if the pivot is consistently the minimum or maximum element (e.g. sorted input with poor pivot choice), the recurrence becomes $T(N-1) + O(N) = O(N^2)$."
          }
        ],
        references: [
          { title: "Big-O Cheat Sheet", url: "https://www.bigocheatsheet.com/" }
        ]
      },
      {
        title: "Arrays: Two Pointers & Sliding Window",
        summary: "Two Pointers and Sliding Window techniques optimize brute-force $O(N^2)$ subarray and pair search problems into optimal $O(N)$ linear time solutions.",
        keyPoints: [
          "Two Pointers: inward scan for sorted pairs (Two Sum II), fast/slow for partitions.",
          "Sliding Window: fixed-size window (sum of K elements) or variable dynamic window (longest substring without repeating characters).",
          "Maintains state between window boundaries to prevent re-computing subarrays.",
          "Essential LeetCode pattern asked by 90% of product companies."
        ],
        example: {
          language: "javascript",
          code: `// Longest Substring Without Repeating Characters (Sliding Window)
function lengthOfLongestSubstring(s) {
  const seen = new Map();
  let maxLen = 0, left = 0;
  for (let right = 0; right < s.length; right++) {
    if (seen.has(s[right]) && seen.get(s[right]) >= left) {
      left = seen.get(s[right]) + 1;
    }
    seen.set(s[right], right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}`
        },
        interviewQuestions: [
          {
            question: "How does Sliding Window reduce time complexity from $O(N^2)$ to $O(N)$?",
            answer: "Instead of recalculating the entire subarray for every possible starting index ($O(N^2)$), a sliding window slides boundaries incrementally. Each element is added once by the right pointer and removed at most once by the left pointer, resulting in $2N = O(N)$ total operations."
          }
        ],
        references: [
          { title: "LeetCode: 3. Longest Substring Without Repeating Characters", url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/" }
        ]
      },
      {
        title: "Linked Lists: Reversal & Fast-Slow Pointers",
        summary: "Linked Lists are linear collections where elements are stored in nodes connected by pointers. Core interview techniques include pointer reversal and Floyd's Cycle Detection.",
        keyPoints: [
          "In-place Reversal: requires three pointers (`prev`, `curr`, `next`) in $O(N)$ time and $O(1)$ space.",
          "Fast & Slow Pointers (Tortoise & Hare): finds middle of list or detects cycles in $O(N)$.",
          "Dummy Head Node: simplifies edge cases when modifying the head node.",
          "Merge Two Sorted Lists: basis of Linked List MergeSort."
        ],
        example: {
          language: "javascript",
          code: `// Floyd's Cycle Detection (Tortoise and Hare)
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true; // Cycle detected
  }
  return false;
}`
        },
        interviewQuestions: [
          {
            question: "How do you find the start node of a cycle in a Linked List?",
            answer: "1. Detect cycle using fast/slow pointers. 2. When they meet, reset `slow` to the head while keeping `fast` at the meeting point. 3. Advance both pointers one step at a time (`slow = slow.next; fast = fast.next`). 4. The node where they meet again is mathematically the exact start of the cycle."
          }
        ],
        references: [
          { title: "LeetCode: 142. Linked List Cycle II", url: "https://leetcode.com/problems/linked-list-cycle-ii/" }
        ]
      },
      {
        title: "Stacks & Monotonic Stack Patterns",
        summary: "A Stack is a LIFO data structure. A Monotonic Stack maintains elements in strictly increasing or decreasing order, solving 'Next Greater Element' and 'Largest Rectangle in Histogram' in linear time.",
        keyPoints: [
          "Standard operations: push, pop, peek in $O(1)$ time.",
          "Used for balancing parentheses, evaluation of postfix expressions, and DFS recursion call stacks.",
          "Monotonic Stack: whenever a new element violates monotonicity, pop elements from stack to compute their bounds.",
          "Transforms quadratic $O(N^2)$ brute-force comparisons to $O(N)$."
        ],
        example: {
          language: "javascript",
          code: `// Next Greater Element (Monotonic Decreasing Stack)
function nextGreaterElements(nums) {
  const res = new Array(nums.length).fill(-1);
  const stack = []; // indices
  for (let i = 0; i < nums.length; i++) {
    while (stack.length && nums[i] > nums[stack[stack.length - 1]]) {
      const idx = stack.pop();
      res[idx] = nums[i];
    }
    stack.push(i);
  }
  return res;
}`
        },
        interviewQuestions: [
          {
            question: "How does a Monotonic Stack solve 'Daily Temperatures' in $O(N)$ time?",
            answer: "We maintain a stack of indices with decreasing temperatures. For each day, we pop all stack indices whose temperature is lower than the current day (the current day is their next warmer day) and record the difference in indices. Every element enters and leaves the stack at most once ($O(N)$)."
          }
        ],
        references: [
          { title: "LeetCode: 739. Daily Temperatures", url: "https://leetcode.com/problems/daily-temperatures/" }
        ]
      },
      {
        title: "Binary Trees & Breadth/Depth-First Traversals",
        summary: "A Binary Tree is a hierarchical structure where each node has at most two children. Depth-First Traversals (Pre, In, Post) and Breadth-First (Level-Order) form the basis of tree interview questions.",
        keyPoints: [
          "Inorder (Left, Root, Right): yields sorted order for Binary Search Trees.",
          "Preorder (Root, Left, Right): used to serialize/clone a tree.",
          "Postorder (Left, Right, Root): used in bottom-up deletions and subtree aggregations.",
          "Level Order Traversal uses a Queue (BFS) with $O(N)$ time and $O(W)$ max width space."
        ],
        example: {
          language: "javascript",
          code: `// Level Order Traversal (BFS)
function levelOrder(root) {
  if (!root) return [];
  const result = [], queue = [root];
  while (queue.length) {
    const levelSize = queue.length, currentLevel = [];
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      currentLevel.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(currentLevel);
  }
  return result;
}`
        },
        interviewQuestions: [
          {
            question: "How do you calculate the Maximum Depth (Height) of a Binary Tree?",
            answer: "Using post-order recursion: `maxDepth(root) = 1 + Math.max(maxDepth(root.left), maxDepth(root.right))` with base case `if (!root) return 0;`. Time complexity is $O(N)$ and space complexity is $O(H)$ where $H$ is tree height."
          }
        ],
        references: [
          { title: "LeetCode: 102. Binary Tree Level Order Traversal", url: "https://leetcode.com/problems/binary-tree-level-order-traversal/" }
        ]
      },
      {
        title: "Dynamic Programming: 0/1 Knapsack & Longest Common Subsequence",
        summary: "Dynamic Programming solves complex problems by breaking them into overlapping subproblems with optimal substructure, caching intermediate results via Memoization (top-down) or Tabulation (bottom-up).",
        keyPoints: [
          "State Definition: precisely define what `dp[i][j]` represents.",
          "Transition Formula (Recurrence Relation): expresses `dp[i]` in terms of smaller states.",
          "Base Case: initialization to prevent out-of-bounds errors.",
          "Space Optimization: rolling array optimization reduces space from $O(N \\times W)$ to $O(W)$."
        ],
        example: {
          language: "javascript",
          code: `// 0/1 Knapsack (1D Space Optimized)
function knapsack(weights, values, W) {
  const dp = new Array(W + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    // Traverse backwards to avoid using the same item multiple times
    for (let w = W; w >= weights[i]; w--) {
      dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
    }
  }
  return dp[W];
}`
        },
        interviewQuestions: [
          {
            question: "Why do we iterate backwards from $W$ down to $weights[i]$ in 1D Knapsack?",
            answer: "If we iterate forwards ($w = weights[i]$ to $W$), `dp[w - weights[i]]` would have already been updated in the CURRENT item's iteration, effectively allowing the same item to be picked multiple times (which converts it into Unbounded Knapsack). Iterating backwards ensures we reference values from the previous item's state."
          }
        ],
        references: [
          { title: "GeeksforGeeks: 0/1 Knapsack Problem", url: "https://www.geeksforgeeks.org/0-1-knapsack-problem-dp-10/" },
          { title: "LeetCode: 1143. Longest Common Subsequence", url: "https://leetcode.com/problems/longest-common-subsequence/" }
        ]
      }
    ]
  }
];
