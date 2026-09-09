## When developing for the Bruce firmware follow these rules

❌ No modern JavaScript features – Use only ES5 syntax:

❌ No let (use var instead).

❌ No for...of loops (use traditional for loops with indexes).

❌ No Arrow functions () => {} (use function instead).

❌ No import ir from 'ir' import syntax use const ir = require('ir'); instead.

❌ No External npm module imports.

❌ No Object.entries(), Promise, async/await, setInterval, setTimeout (for now).

If you want modern JS features as well as TypeScript support you can go here https://wiki.bruce.computer/interpreter/typescript/

Info about the modules for Bruce can be found here 
https://wiki.bruce.computer/interpreter/#modules
