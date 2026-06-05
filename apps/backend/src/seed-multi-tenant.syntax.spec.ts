import { readFileSync } from 'fs';
import { join } from 'path';

describe('seed-multi-tenant SQL syntax', () => {
  it('no debe usar la clausula inválida ON DUPLICATE_KEY', () => {
    const rutaSeed = join(process.cwd(), 'src', 'seed-multi-tenant.ts');
    const contenido = readFileSync(rutaSeed, 'utf8');

    expect(contenido).not.toContain('ON DUPLICATE_KEY');
  });
});
