-- Ukázková data pro lokální vývoj (zástupné texty, nahraďte vlastním obsahem).
-- Spuštění: wrangler d1 execute videokurzy-db --local --file=scripts/seed.sql

-- Kurz
INSERT OR REPLACE INTO course (id, title, slug, description, published) VALUES
  (1, '[název kurzu]', 'ukazkovy-kurz', '[popis kurzu]', 1);

-- Moduly
INSERT OR REPLACE INTO module (id, courseId, title, slug, sortOrder) VALUES
  (1, 1, '[modul 1]', 'modul-1', 1);
INSERT OR REPLACE INTO module (id, courseId, title, slug, sortOrder) VALUES
  (2, 1, '[modul 2]', 'modul-2', 2);
INSERT OR REPLACE INTO module (id, courseId, title, slug, sortOrder) VALUES
  (3, 1, '[modul 3]', 'modul-3', 3);

-- Lekce, modul 1 (zdarma na ukázku)
INSERT OR REPLACE INTO lesson (id, moduleId, publicId, title, slug, bunnyVideoId, durationSeconds, isFree, sortOrder) VALUES
  (1, 1, 'ep01', '[lekce 1]', 'lekce-1', NULL, 0, 1, 1),
  (2, 1, 'ep02', '[lekce 2]', 'lekce-2', NULL, 0, 1, 2),
  (3, 1, 'ep03', '[lekce 3]', 'lekce-3', NULL, 0, 1, 3);

-- Lekce, modul 2
INSERT OR REPLACE INTO lesson (id, moduleId, publicId, title, slug, bunnyVideoId, durationSeconds, isFree, sortOrder) VALUES
  (4, 2, 'ep04', '[lekce 4]', 'lekce-4', NULL, 0, 0, 1),
  (5, 2, 'ep05', '[lekce 5]', 'lekce-5', NULL, 0, 0, 2),
  (6, 2, 'ep06', '[lekce 6]', 'lekce-6', NULL, 0, 0, 3),
  (7, 2, 'ep07', '[lekce 7]', 'lekce-7', NULL, 0, 0, 4);

-- Lekce, modul 3
INSERT OR REPLACE INTO lesson (id, moduleId, publicId, title, slug, bunnyVideoId, durationSeconds, isFree, sortOrder) VALUES
  (8, 3, 'ep08', '[lekce 8]', 'lekce-8', NULL, 0, 0, 1),
  (9, 3, 'ep09', '[lekce 9]', 'lekce-9', NULL, 0, 0, 2),
  (10, 3, 'ep10', '[lekce 10]', 'lekce-10', NULL, 0, 0, 3);

-- ─── Admin uživatelé ────────────────────────────────────────────────
-- Admini se řídí seznamem ADMIN_EMAIL_LIST v src/config/site.ts.
-- Po prvním přihlášení magic linkem Better Auth vytvoří user record
-- a middleware mu nastaví role = 'admin'.
-- Seed proto nevytváří žádné user záznamy (bránilo by to signupu
-- přes Better Auth kvůli UNIQUE(email) kolizi s pre-seed ID).
