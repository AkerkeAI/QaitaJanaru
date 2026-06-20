const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const root = path.join(process.cwd(), 'app');
const interfaceFile = path.join(root, 'types', 'messages.ts');
const localeDir = path.join(root, 'messages');

function parseInterface(file){
  const text = fs.readFileSync(file,'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let iface = null;
  function visit(node){
    if(ts.isInterfaceDeclaration(node) && node.name.text === 'Messages'){
      iface = node;
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  if(!iface) throw new Error('Interface Messages not found');
  function walk(members){
    const result = {};
    members.forEach(member => {
      if(ts.isPropertySignature(member) && member.name){
        const name = member.name.getText(sf).replace(/['\"]/g,'');
        const type = member.type;
        if(type && ts.isTypeLiteralNode(type)){
          result[name] = walk(type.members);
        } else {
          result[name] = null;
        }
      }
    });
    return result;
  }
  return walk(iface.members);
}

function parseMessages(file){
  const text = fs.readFileSync(file,'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let initializer = null;
  function visit(node){
    if(ts.isVariableStatement(node)){
      node.declarationList.declarations.forEach(decl => {
        if(ts.isIdentifier(decl.name) && decl.name.text === 'messages' && decl.initializer && ts.isObjectLiteralExpression(decl.initializer)){
          initializer = decl.initializer;
        }
      });
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  if(!initializer) throw new Error('messages object not found in ' + file);
  function walk(node){
    const result = {};
    node.properties.forEach(prop => {
      if(ts.isPropertyAssignment(prop)){
        const name = prop.name.getText(sf).replace(/['\"]/g,'');
        if(ts.isObjectLiteralExpression(prop.initializer)){
          result[name] = walk(prop.initializer);
        } else {
          result[name] = null;
        }
      }
    });
    return result;
  }
  return walk(initializer);
}

function flatten(obj, prefix=''){
  const keys = [];
  Object.keys(obj).forEach(k => {
    const key = prefix ? `${prefix}.${k}` : k;
    if(obj[k] && typeof obj[k] === 'object'){
      keys.push(...flatten(obj[k], key));
    } else {
      keys.push(key);
    }
  });
  return keys;
}

const iface = parseInterface(interfaceFile);
const ifaceKeys = flatten(iface).sort();
const langs = ['en','ru','kz'];
const results = {};
langs.forEach(lang => {
  const pathFile = path.join(localeDir, `${lang}.ts`);
  const msg = parseMessages(pathFile);
  const keys = flatten(msg).sort();
  const extra = keys.filter(k => !ifaceKeys.includes(k));
  const missing = ifaceKeys.filter(k => !keys.includes(k));
  results[lang] = { extra, missing };
});
console.log(JSON.stringify(results, null, 2));
