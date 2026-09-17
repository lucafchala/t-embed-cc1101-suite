#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import * as babel from '@babel/core';

// Catch variables to preserve
const reserved = new Set(['errorVar1', 'errorVar2', 'errorVar3', 'errorVar4', 'errorVar5']);

function renameCatchVariablesPlugin() {
  let counter = 0;

  return {
    visitor: {
      CatchClause(path) {
        const param = path.node.param;
        if (!param || param.type !== 'Identifier') return;

        // Skip reserved variables
        if (reserved.has(param.name)) return;

        const oldName = param.name;
        const newName = `_c${counter++}`;
        path.scope.rename(oldName, newName);
      }
    }
  };
}

// Paths
const inputFile = path.resolve('minified', 'App Store.terser.js');
const tempFile = path.resolve('minified', 'App Store.babel.js');
const code = fs.readFileSync(inputFile, 'utf8');

const result = babel.transformSync(code, {
  babelrc: false,
  configFile: false,
  plugins: [renameCatchVariablesPlugin],
  parserOpts: { allowReturnOutsideFunction: true },
  generatorOpts: {
    compact: true,
    minified: true,
    comments: false
  }
});

fs.writeFileSync(tempFile, result.code, 'utf8');
console.log(`Catch variables renamed and written to ${tempFile}`);
