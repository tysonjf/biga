-- Saved recipes. Ids are generated on the device so recipes can be created offline and optimistically.
create table "recipe" (
  "id" text not null primary key,
  "user_id" text not null references "user" ("id") on delete cascade,
  "kind" text not null check ("kind" in ('biga', 'poolish')),
  "name" text not null,
  "settings" text not null,
  "created_at" integer not null,
  "updated_at" integer not null
);
create index "recipe_user_updated_idx" on "recipe" ("user_id", "updated_at" desc);
