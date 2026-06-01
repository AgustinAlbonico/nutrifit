import { Project, SyntaxKind } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

// 1. Refactor ORM Entities
const ormFiles = project.getSourceFiles('src/infrastructure/persistence/typeorm/entities/*.ts');

for (const file of ormFiles) {
  const filePath = file.getFilePath();
  if (filePath.includes('auditable.orm-entity.ts') || filePath.endsWith('.spec.ts') || filePath.endsWith('index.ts')) continue;

  let modified = false;
  const classes = file.getClasses();
  
  for (const cls of classes) {
    if (!cls.getName()?.endsWith('OrmEntity')) continue;
    
    // Skip if already extends AuditableOrmEntity
    if (cls.getBaseClass()?.getName() === 'AuditableOrmEntity') continue;

    // Check if it already extends something else (e.g. PersonaOrmEntity)
    if (cls.getBaseClass()) {
        console.log(`Skipping ${cls.getName()} because it already extends ${cls.getBaseClass()?.getName()}`);
        continue;
    }

    cls.setExtends('AuditableOrmEntity');
    
    // Remove activo/eliminadoEn properties if they exist
    const activoProp = cls.getProperty('activo');
    if (activoProp) activoProp.remove();
    
    const eliminadoEnProp = cls.getProperty('eliminadoEn');
    if (eliminadoEnProp) eliminadoEnProp.remove();

    const fechaBajaProp = cls.getProperty('fechaBaja');
    if (fechaBajaProp) fechaBajaProp.remove();

    modified = true;
  }

  if (modified) {
    // Add import
    const existingImport = file.getImportDeclaration(imp => imp.getModuleSpecifierValue().includes('auditable.orm-entity'));
    if (!existingImport) {
      file.addImportDeclaration({
        namedImports: ['AuditableOrmEntity'],
        moduleSpecifier: '../common/auditable.orm-entity',
      });
    }
    file.saveSync();
    console.log(`Updated ORM entity: ${file.getBaseName()}`);
  }
}

// 2. Refactor Domain Entities
const domainFiles = project.getSourceFiles('src/domain/entities/**/*.ts');

for (const file of domainFiles) {
  const filePath = file.getFilePath();
  if (filePath.endsWith('.spec.ts') || filePath.includes('Enum') || filePath.includes('auditable.entity.ts') || filePath.endsWith('index.ts')) continue;

  let modified = false;
  const classes = file.getClasses();

  for (const cls of classes) {
    // If it doesn't look like an entity, skip
    if (!cls.getName()?.endsWith('Entity') && cls.getName() !== 'Alimento') {
        // Personas like Socio, Entrenador don't have 'Entity' sometimes?
        // Wait, Entrenador is EntrenadorEntity? Let's just process all classes that don't have 'Dto' or 'Enum'
    }

    // Skip if already extends AuditableEntity
    if (cls.getBaseClass()?.getName() === 'AuditableEntity') continue;

    // If it extends something else (e.g. PersonaEntity), skip adding extends
    let needsExtends = true;
    if (cls.getBaseClass()) {
        needsExtends = false;
        console.log(`Skipping extends for ${cls.getName()} (extends ${cls.getBaseClass()?.getName()})`);
    }

    if (needsExtends) {
        cls.setExtends('AuditableEntity');
    }
    
    // Clean up existing fechaBaja if defined as property
    const prop = cls.getProperty('fechaBaja');
    if (prop) prop.remove();

    // Find constructor
    const constructors = cls.getConstructors();
    if (constructors.length > 0) {
      const ctor = constructors[0];
      
      // Add fechaBaja to parameters if not exists
      const params = ctor.getParameters();
      const hasFechaBaja = params.some(p => p.getName() === 'fechaBaja');
      
      if (!hasFechaBaja) {
        ctor.addParameter({
          name: 'fechaBaja',
          type: 'Date | null',
          initializer: 'null'
        });
      }

      // Add super(fechaBaja) if we added extends
      if (needsExtends) {
          const body = ctor.getBodyText() || '';
          if (!body.includes('super(')) {
              ctor.setBodyText(`super(fechaBaja);\n${body}`);
          }
      } else {
          // If it inherits from something else, we need to pass fechaBaja to super
          const superCall = ctor.getStatements().find(s => s.getText().startsWith('super('));
          if (superCall) {
              const text = superCall.getText();
              if (!text.includes('fechaBaja')) {
                  superCall.replaceWithText(text.replace(');', ', fechaBaja);'));
              }
          }
      }
    }

    modified = true;
  }

  if (modified) {
    const depth = filePath.split('src/domain/entities/')[1].split('/').length - 1;
    const relPath = '../'.repeat(depth) + '../shared/auditable.entity';
    
    const existingImport = file.getImportDeclaration(imp => imp.getModuleSpecifierValue().includes('auditable.entity'));
    if (!existingImport) {
      file.addImportDeclaration({
        namedImports: ['AuditableEntity'],
        moduleSpecifier: relPath,
      });
    }
    file.saveSync();
    console.log(`Updated Domain entity: ${file.getBaseName()}`);
  }
}

console.log('Done.');
