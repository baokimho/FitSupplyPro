import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const privateKeyPath = path.join(scriptDir, "../keys/private.json");
const publicKeyPath = path.join(scriptDir, "../keys/public.json");

const privateBase64 = fs.readFileSync(privateKeyPath).toString('base64');
const publicBase64 = fs.readFileSync(publicKeyPath).toString('base64');

console.log('--- JWT_PRIVATE_KEY_BASE64 ---');
console.log(privateBase64);
console.log('\n--- JWT_PUBLIC_KEY_BASE64 ---');
console.log(publicBase64);