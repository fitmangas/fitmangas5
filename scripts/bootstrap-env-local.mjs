import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const example = path.join(root, '.env.example');
const local = path.join(root, '.env.local');

if (fs.existsSync(local)) {
  console.log('.env.local existe déjà — aucun fichier créé ou écrasé.');
  console.log(`Chemin : ${local}`);
  process.exit(0);
}

if (!fs.existsSync(example)) {
  console.error('Fichier .env.example introuvable à la racine du projet.');
  process.exit(1);
}

fs.copyFileSync(example, local);
console.log('Fichier .env.local créé à partir de .env.example.');
console.log(`Ouvre-le et remplis les valeurs après le "=" : ${local}`);
console.log('Ensuite : npm run seed:blog:complete -- --limit=2');
