-- Manual recipes: a fourth recipe type, a plain baker's-percentage calculator. Like 0004, the recipe,
-- bake and playground tables are rebuilt, keeping every row, but this time without a check on
-- "kind": the Worker only accepts the kinds it knows (shared/recipe.ts KINDS), so a new kind won't
-- need another rebuild.
--
-- Same order as 0004, for the same reason: bake references recipe with ON DELETE CASCADE, so the new
-- bake table points at the new recipe table, and the old bake table is dropped before the old recipe
-- table so dropping it can't take any bakes with it.

create table "recipe_new" (
  "id" text not null primary key,
  "user_id" text not null references "user" ("id") on delete cascade,
  "kind" text not null,
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
  "kind" text not null,
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
  "kind" text not null,
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
