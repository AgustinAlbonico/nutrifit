import dotenv from 'dotenv';
import { createTransport } from 'nodemailer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const envPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  'apps',
  'backend',
  '.env',
);
dotenv.config({ path: envPath });

// Re-read raw .env for vars dotenv might have skipped
const raw = readFileSync(envPath, 'utf-8');
const env = Object.fromEntries(
  raw
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    }),
);

const host = env['SMTP_HOST'] || 'smtp-mail.outlook.com';
const port = Number(env['SMTP_PORT']) || 587;
const secure = ['true', '1', 'yes', 'si'].includes(
  (env['SMTP_SECURE'] || '').toLowerCase(),
);
const user = env['SMTP_USER'] || '';
const pass = env['SMTP_PASS'] || '';
const from = env['SMTP_FROM'] || user;
const to = process.argv[2] || 'agusalbo2024@gmail.com';

console.log('=== Config SMTP ===');
console.log('Host:', host);
console.log('Port:', port);
console.log('Secure:', secure);
console.log('User:', user ? user : '— VACÍO —');
console.log('Pass:', pass ? `${pass.length} chars` : '— VACÍO —');
console.log('From:', from);
console.log('To:', to);
console.log();

const transporter = createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
});

try {
  const info = await transporter.sendMail({
    from: `"NutriFit Test" <${from}>`,
    to,
    subject: '🧪 Prueba SMTP NutriFit',
    text: 'Si ves esto, el SMTP de NutriFit anda perfecto.',
    html: '<h2>✅ SMTP configurado correctamente</h2><p>Si ves esto, el envío de emails de NutriFit anda perfecto.</p>',
  });

  console.log('✅ EMAIL ENVIADO OK');
  console.log('Message ID:', info.messageId);
  if (info.accepted?.length) console.log('Accepted:', info.accepted);
  if (info.rejected?.length) console.log('Rejected:', info.rejected);
} catch (err) {
  console.error('❌ ERROR al enviar:');
  console.error(err.message);
  if (err.code) console.error('Code:', err.code);
  if (err.responseCode) console.error('Response:', err.responseCode, err.response);
  process.exit(1);
}
