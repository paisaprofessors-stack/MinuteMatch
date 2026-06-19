create table if not exists users (
  user_id text primary key,
  display_name text not null,
  age_confirmed boolean not null default false,
  gender text not null,
  show_me text not null,
  interests text[] not null default '{}',
  language text not null,
  mode text not null,
  safety_agreed boolean not null default false,
  status text not null default 'active',
  report_count integer not null default 0,
  created_at bigint not null,
  updated_at bigint not null
);

create table if not exists sessions (
  id text primary key,
  user_a_id text not null references users(user_id),
  user_b_id text not null references users(user_id),
  users_ready text[] not null default '{}',
  shared_interest text not null,
  icebreaker text not null,
  status text not null,
  mode text not null,
  created_at bigint not null,
  started_at bigint,
  ended_at bigint,
  ended_reason text
);

create table if not exists friendships (
  id text primary key,
  requester_id text not null references users(user_id),
  receiver_id text not null references users(user_id),
  users text[] not null,
  status text not null,
  shared_interest text not null,
  session_id text references sessions(id),
  created_at bigint not null,
  accepted_at bigint,
  declined_at bigint,
  updated_at bigint
);

create unique index if not exists friendships_pair_active_idx
  on friendships (least(users[1], users[2]), greatest(users[1], users[2]))
  where status in ('pending', 'accepted');

create table if not exists messages (
  id text primary key,
  room_id text not null,
  sender_id text not null references users(user_id),
  sender_name text not null,
  body text not null,
  kind text not null,
  moderation_code text,
  created_at bigint not null
);

create index if not exists messages_room_created_idx on messages (room_id, created_at);

create table if not exists blocks (
  blocker_id text not null references users(user_id),
  blocked_user_id text not null references users(user_id),
  created_at bigint not null,
  primary key (blocker_id, blocked_user_id)
);

create table if not exists reports (
  id text primary key,
  reporter_id text not null references users(user_id),
  reported_user_id text not null references users(user_id),
  session_id text references sessions(id),
  friendship_id text references friendships(id),
  call_request_id text,
  reason text not null,
  details text,
  status text not null default 'open',
  created_at bigint not null
);

create table if not exists call_requests (
  id text primary key,
  friendship_id text not null references friendships(id),
  requester_id text not null references users(user_id),
  receiver_id text not null references users(user_id),
  mode text not null,
  status text not null,
  created_at bigint not null,
  expires_at bigint not null,
  accepted_at bigint,
  declined_at bigint,
  ended_at bigint,
  room_id text
);

create table if not exists presence (
  user_id text primary key references users(user_id),
  socket_id text,
  online boolean not null default false,
  last_seen_at bigint not null,
  current_session_id text,
  current_call_id text
);

create table if not exists contact_violations (
  id bigserial primary key,
  user_id text not null references users(user_id),
  room_id text,
  kind text,
  attempted_body text,
  created_at bigint not null
);
