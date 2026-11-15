import fs from 'node:fs';
const filters=fs.readFileSync('backend/filters.js','utf8').replace(/^export /gm,'');
const api=fs.readFileSync('backend/api.js','utf8').replace(/^export /gm,'').replace(/^import .*;\n/gm,'');
const source=fs.readFileSync('backend/index.js','utf8').replace(/^import .*;\n/gm,'');
fs.mkdirSync('backend/dist/server',{recursive:true});fs.writeFileSync('backend/dist/server/index.js',filters+'\n'+api+'\n'+source);
