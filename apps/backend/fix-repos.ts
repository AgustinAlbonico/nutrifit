import { Project } from 'ts-morph';

const project = new Project({ tsConfigFilePath: 'tsconfig.json' });
const repoFiles = project.getSourceFiles('src/domain/entities/**/*.repository.ts');

for (const file of repoFiles) {
  let modified = false;
  for (const cls of file.getClasses()) {
    if (cls.getBaseClass()?.getName() === 'AuditableEntity') {
      cls.removeExtends();
      modified = true;
    }
  }
  
  if (modified) {
    const imp = file.getImportDeclaration(i => i.getModuleSpecifierValue().includes('auditable.entity'));
    if (imp) imp.remove();
    file.saveSync();
    console.log('Fixed', file.getBaseName());
  }
}
