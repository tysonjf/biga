-- Saved topping recipes. Like recipes, ids are generated on the device for offline, optimistic saves.
create table "topping" (
  "id" text not null primary key,
  "user_id" text not null references "user" ("id") on delete cascade,
  "name" text not null,
  "data" text not null,
  "created_at" integer not null,
  "updated_at" integer not null
);
create index "topping_user_updated_idx" on "topping" ("user_id", "updated_at" desc);
