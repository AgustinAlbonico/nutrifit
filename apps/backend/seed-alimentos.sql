-- Seed de alimentos para NutriFit Supervisor
-- Ejecutar con: mysql -u <usuario> -p <database> < seed-alimentos.sql
-- O desde Workbench/phpMyAdmin: copiar y pegar

USE nutrifit_supervisor;

-- Limpiar tabla si es necesario (descomentar si querés limpiar primero)
-- DELETE FROM alimento_grupo_alimenticio;
-- DELETE FROM alimento;

-- Insertar alimentos comunes
INSERT INTO alimento (nombre, cantidad, calorias, proteinas, carbohidratos, grasas, hidratos_de_carbono, unidad_medida) VALUES
-- Proteínas
('Huevo', 100, 155, 13, 1, 11, 1, 'gramo'),
('Pechuga de pollo', 100, 165, 31, 0, 4, 0, 'gramo'),
('Carne magra', 100, 143, 26, 0, 5, 0, 'gramo'),
('Pescado blanco', 100, 114, 24, 0, 1, 0, 'gramo'),
('Salmón', 100, 208, 20, 0, 13, 0, 'gramo'),
('Atún en lata', 100, 116, 26, 0, 1, 0, 'gramo'),
('Queso cottage', 100, 98, 11, 3, 5, 3, 'gramo'),
('Queso mozzarella', 30, 85, 6, 1, 6, 1, 'gramo'),
('Yogur natural', 150, 90, 6, 7, 4, 7, 'gramo'),
('Leche descremada', 250, 90, 8, 12, 0, 12, 'mililitro'),

-- Carbohidratos
('Arroz integral', 100, 370, 8, 77, 3, 77, 'gramo'),
('Arroz blanco', 100, 360, 7, 80, 1, 80, 'gramo'),
('Quinoa', 100, 368, 14, 64, 6, 64, 'gramo'),
('Avena', 50, 190, 7, 32, 3, 32, 'gramo'),
('Pan integral', 50, 130, 5, 23, 2, 23, 'gramo'),
('Pan blanco', 50, 135, 4, 25, 1, 25, 'gramo'),
('Pasta', 100, 350, 12, 75, 2, 75, 'gramo'),
('Papa', 150, 130, 3, 30, 0, 30, 'gramo'),
('Batata', 150, 140, 2, 32, 0, 32, 'gramo'),

-- Vegetales
('Lechuga', 50, 8, 1, 1, 0, 1, 'gramo'),
('Tomate', 100, 18, 1, 4, 0, 4, 'gramo'),
('Zanahoria', 100, 41, 1, 10, 0, 10, 'gramo'),
('Brócoli', 100, 34, 3, 7, 0, 7, 'gramo'),
('Espinaca', 100, 23, 3, 4, 0, 4, 'gramo'),
('Calabacín', 100, 17, 1, 3, 0, 3, 'gramo'),
('Pimiento', 100, 31, 1, 6, 0, 6, 'gramo'),
('Cebolla', 100, 40, 1, 9, 0, 9, 'gramo'),
('Ajo', 10, 15, 1, 3, 0, 3, 'gramo'),
('Pepino', 100, 15, 1, 4, 0, 4, 'gramo'),

-- Frutas
('Manzana', 150, 78, 0, 21, 0, 21, 'gramo'),
('Banana', 120, 105, 1, 27, 0, 27, 'gramo'),
('Naranja', 180, 85, 2, 21, 0, 21, 'gramo'),
('Pera', 150, 85, 1, 22, 0, 22, 'gramo'),
('Frutilla', 100, 32, 1, 8, 0, 8, 'gramo'),
('Arándanos', 100, 57, 1, 14, 0, 14, 'gramo'),
('Uva', 100, 69, 1, 18, 0, 18, 'gramo'),
('Melón', 150, 54, 1, 13, 0, 13, 'gramo'),
('Sandía', 150, 46, 1, 12, 0, 12, 'gramo'),
('Mango', 150, 99, 1, 25, 1, 25, 'gramo'),

-- Legumbres
('Lentejas', 100, 290, 18, 40, 1, 40, 'gramo'),
('Porotos negros', 100, 280, 21, 40, 1, 40, 'gramo'),
('Garbanzos', 100, 310, 15, 45, 5, 45, 'gramo'),

-- Frutos secos y semillas
('Almendras', 30, 174, 6, 6, 15, 6, 'gramo'),
('Nueces', 30, 196, 5, 4, 19, 4, 'gramo'),
('Maní', 30, 172, 7, 5, 14, 5, 'gramo'),
('Semillas de chía', 15, 73, 2, 6, 5, 6, 'gramo'),
('Semillas de lino', 15, 75, 3, 4, 6, 4, 'gramo'),

-- Grasas saludables
('Aceite de oliva', 15, 133, 0, 0, 15, 0, 'mililitro'),
('Palta', 100, 160, 2, 9, 15, 9, 'gramo'),

-- Otros
('Miel', 20, 64, 0, 17, 0, 17, 'gramo'),
('Chocolate negro 70%', 30, 168, 2, 13, 12, 13, 'gramo'),
('Café negro', 250, 2, 0, 0, 0, 0, 'mililitro'),
('Té verde', 250, 2, 0, 0, 0, 0, 'mililitro'),
('Agua', 250, 0, 0, 0, 0, 0, 'mililitro');

-- Verificar inserción
SELECT COUNT(*) AS 'Alimentos insertados' FROM alimento;

-- Mostrar todos los alimentos
SELECT id_alimento, nombre, calorias, proteinas, carbohidratos, grasas, unidad_medida FROM alimento ORDER BY nombre;
