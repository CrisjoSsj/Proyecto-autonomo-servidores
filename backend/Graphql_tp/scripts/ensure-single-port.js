#!/usr/bin/env node
// Verifica si el puerto 3010 está libre y lanza Next sólo si está disponible.
// Si está ocupado, muestra mensaje y termina sin cambiar a otro puerto.

const { execSync, spawn } = require('child_process');
const PORT = process.env.PORT || '3010';

function portInUse(port) {
  try {
    // Windows: usar netstat para verificar
    const out = execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe' }).toString();
    return out.includes(`:${port}`);
  } catch {
    return false;
  }
}

if (portInUse(PORT)) {
  console.error(`\n[ERROR] El puerto ${PORT} ya está en uso.\nCierra procesos previos antes de continuar.\nPara matar procesos node: powershell => Get-Process node | Stop-Process -Force\n`);
  process.exit(1);
}

console.log(`Iniciando Next en puerto fijo ${PORT} (modo estricto) ...`);
const child = spawn('npx', ['next', 'dev', '-p', PORT], { stdio: 'inherit', shell: true });
child.on('exit', code => process.exit(code));
