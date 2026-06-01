const fs = require('fs');
const { globSync } = require('glob');

globSync('src/application/planes-alimentacion/use-cases/**/*.ts').forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/activo: true/g, 'fechaBaja: IsNull()');
  c = c.replace(/activo: false/g, 'fechaBaja: Not(IsNull())');
  c = c.replace(/activo: (.*?),/g, '');
  c = c.replace(/plan\.activo/g, '(!plan.fechaBaja)');
  c = c.replace(/eliminadoEn/g, 'fechaBaja');
  
  if (c.includes('IsNull()') && !c.includes('IsNull')) {
    if (c.includes('import { ')) {
       c = c.replace(/import { (.*?) } from 'typeorm';/, "import { $1, IsNull, Not } from 'typeorm';");
    } else {
       c = "import { IsNull, Not } from 'typeorm';\n" + c;
    }
  }
  
  fs.writeFileSync(f, c);
});
