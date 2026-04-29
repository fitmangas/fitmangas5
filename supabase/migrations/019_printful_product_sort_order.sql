create table if not exists public.printful_product_sort_order (
  product_id bigint primary key,
  sort_order integer not null default 1000,
  updated_at timestamptz not null default now()
);

create index if not exists printful_product_sort_order_sort_order_idx
  on public.printful_product_sort_order (sort_order asc);
