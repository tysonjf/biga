-- Direct doughs: a third recipe type, with no preferment. SQLite can't change a check constraint, so
-- the recipe, bake and playground tables are rebuilt with 'direct' allowed, keeping every row.
--
-- The order matters. bake references recipe with ON DELETE CASCADE, and dropping a table deletes its
-- rows first, so dropping the old recipe table while bakes still point at it would delete every bake.
-- The new bake table points at the new recipe table from the start; the old bake table is dropped
-- before the old recipe table, so nothing refers to it by then; and renaming recipe_new to recipe
-- carries bake's reference along to the new name.

create table "recipe_new" (
  "id" text not null primary key,
  "user_id" text not null references "user" ("id") on delete cascade,
  "kind" text not null check ("kind" in ('biga', 'poolish', 'direct')),
  "name" text not null,
  "settings" text not null,
  "created_at" integer not null,
  "updated_at" integer not null,
  "notes" text not null default ''
);
insert into "recipe_new" ("id", "user_id", "kind", "name", "settings", "created_at", "updated_at", "notes")
select "id", "user_id", "kind", "name", "settings", "created_at", "updated_at", "notes" from "recipe";

create table "bake_new" (
  "id" text not null primary key,
  "user_id" text not null references "user" ("id") on delete cascade,
  "recipe_id" text not null references "recipe_new" ("id") on delete cascade,
  "kind" text not null check ("kind" in ('biga', 'poolish', 'direct')),
  "name" text not null,
  "settings" text not null,
  "start" text not null,
  "notes" text not null,
  "created_at" integer not null,
  "updated_at" integer not null
);
insert into "bake_new" ("id", "user_id", "recipe_id", "kind", "name", "settings", "start", "notes", "created_at", "updated_at")
select "id", "user_id", "recipe_id", "kind", "name", "settings", "start", "notes", "created_at", "updated_at" from "bake";

create table "playground_new" (
  "user_id" text not null references "user" ("id") on delete cascade,
  "kind" text not null check ("kind" in ('biga', 'poolish', 'direct')),
  "settings" text not null,
  "updated_at" integer not null,
  primary key ("user_id", "kind")
);
insert into "playground_new" ("user_id", "kind", "settings", "updated_at")
select "user_id", "kind", "settings", "updated_at" from "playground";

drop table "bake";
drop table "playground";
drop table "recipe";

alter table "recipe_new" rename to "recipe";
alter table "bake_new" rename to "bake";
alter table "playground_new" rename to "playground";

create index "recipe_user_updated_idx" on "recipe" ("user_id", "updated_at" desc);
create index "bake_user_updated_idx" on "bake" ("user_id", "updated_at" desc);
create index "bake_recipe_idx" on "bake" ("recipe_id");
