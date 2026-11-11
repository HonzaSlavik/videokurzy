CREATE TABLE `site_config` (
  `key` text PRIMARY KEY NOT NULL,
  `value` text NOT NULL
);--> statement-breakpoint
INSERT INTO `site_config` (`key`, `value`) VALUES
  ('price_individual', '2000'),
  ('price_organization', '15000'),
  ('benefits_individual', '["[výhoda 1]","[výhoda 2]","[výhoda 3]","[výhoda 4]"]'),
  ('benefits_organization', '["[výhoda firemní licence 1]","[výhoda firemní licence 2]","[výhoda firemní licence 3]"]');
