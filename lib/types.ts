export type User = {
  id: number;
  username: string;
  email: string | null;
  password_hash: string;
  is_admin: 0 | 1;
  bio: string | null;
  created_at: number;
  avatar_data: string | null;
  custom_rank: string | null;
  banned_at: number | null;
};

export type SessionUser = Omit<User, "password_hash">;

export type Rank =
  | "creator"
  | "newbie"
  | "regular"
  | "settled"
  | "veteran"
  | "oldschool"
  | "grandpa"
  | "banned";

export type HofMoment = {
  id: number;
  title: string;
  body: string;
  photo_data: string | null;
  occurred_at: number;
  created_at: number;
  author_id: number;
};

export type BlogComment = {
  id: number;
  post_id: number;
  author_id: number;
  author_name: string;
  body: string;
  created_at: number;
};

export type BlogPost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  author_id: number;
  author_name: string;
  published_at: number;
  reading_minutes: number;
};

export type ForumCategory = {
  id: number;
  slug: string;
  name: string;
  description: string;
  position: number;
};

export type ForumThread = {
  id: number;
  category_id: number;
  category_slug: string;
  category_name: string;
  title: string;
  author_id: number;
  author_name: string;
  created_at: number;
  last_post_at: number;
  post_count: number;
};

export type ForumPost = {
  id: number;
  thread_id: number;
  author_id: number;
  author_name: string;
  body: string;
  created_at: number;
};
