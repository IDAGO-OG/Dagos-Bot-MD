// Agrega esto en tu package.json: "type": "module"
import { join, dirname } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { setupMaster, fork } from 'cluster';
import { watchFile, unwatchFile } from 'fs';
import cfonts from 'cfonts';
import { createInterface } from 'readline';
import yargs from 'yargs';

// Definir __dirname en módulos ES
const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url); // Usar import.meta.url para createRequire
const { name, author } = require(join(__dirname, './package.json')); // Leer package.json
const { say } = cfonts;
const rl = createInterface({ input: process.stdin, output: process.stdout });

// Mensaje de inicio
say('Dagos - Bot\nWhatsApp Bot MD', {
  font: 'chrome',
  align: 'center',
  gradient: ['red', 'magenta'],
});

say(`Bot creado por Diego OG`, {
  font: 'console',
  align: 'center',
  gradient: ['red', 'magenta'],
});

let isRunning = false;

/**
 * Inicia un archivo JavaScript
 * @param {String} file Ruta al archivo
 */
function start(file) {
  if (isRunning) return;
  isRunning = true;

  const args = [join(__dirname, file), ...process.argv.slice(2)];

  say('Ajuste la pantalla para escanear el código QR', {
    font: 'console',
    align: 'center',
    gradient: ['red', 'magenta'],
  });

  setupMaster({
    exec: args[0],
    args: args.slice(1),
  });

  const p = fork();
  p.on('message', (data) => {
    console.log('[RECEIVED]', data);
    switch (data) {
      case 'reset':
        p.process.kill();
        isRunning = false;
        start.apply(this, arguments);
        break;
      case 'uptime':
        p.send(process.uptime());
        break;
    }
  });

  p.on('exit', (_, code) => {
    isRunning = false;
    console.error('❎ Ocurrió un error inesperado:', code);
    if (code === 0) return;
    watchFile(args[0], () => {
      unwatchFile(args[0]);
      start(file);
    });
  });

  const opts = yargs(process.argv.slice(2)).exitProcess(false).parse();
  if (!opts.test && !rl.listenerCount()) {
    rl.on('line', (line) => {
      p.emit('message', line.trim());
    });
  }
}

// Iniciar el bot
start('main.js');