-- Recipes become templates (ratios, timings and a written method) and each time you make one you
-- start a bake: its own copy of the settings, when the preferment was mixed, and its own notes.

alter table "recipe" add column "notes" text not null default '';

create table "bake" (
  "id" text not null primary key,
  "user_id" text not null references "user" ("id") on delete cascade,
  "recipe_id" text not null references "recipe" ("id") on delete cascade,
  "kind" text not null check ("kind" in ('biga', 'poolish')),
  "name" text not null,
  "settings" text not null,
  "start" text not null,
  "notes" text not null,
  "created_at" integer not null,
  "updated_at" integer not null
);
create index "bake_user_updated_idx" on "bake" ("user_id", "updated_at" desc);
create index "bake_recipe_idx" on "bake" ("recipe_id");

-- The calculator scratchpad: one per user and preferment, saved as you go.
create table "playground" (
  "user_id" text not null references "user" ("id") on delete cascade,
  "kind" text not null check ("kind" in ('biga', 'poolish')),
  "settings" text not null,
  "updated_at" integer not null,
  primary key ("user_id", "kind")
);

-- Recipes used to hold the time their preferment was mixed. Keep recent and upcoming ones as bakes
-- so a schedule in progress isn't lost, then take the time off the recipe.
insert into "bake" ("id", "user_id", "recipe_id", "kind", "name", "settings", "start", "notes", "created_at", "updated_at")
select lower(hex(randomblob(10))), "user_id", "id", "kind", '', json_remove("settings", '$.start'),
       json_extract("settings", '$.start'), '', "updated_at", "updated_at"
from "recipe"
where json_valid("settings")
  and json_type("settings", '$.start') = 'text'
  and length(json_extract("settings", '$.start')) = 16
  and substr(json_extract("settings", '$.start'), 11, 1) = 'T'
  and json_extract("settings", '$.start') >= strftime('%Y-%m-%dT%H:%M', 'now', '-7 days');

update "recipe" set "settings" = json_remove("settings", '$.start')
where json_valid("settings") and json_type("settings", '$.start') is not null;
