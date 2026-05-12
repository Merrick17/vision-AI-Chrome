-- Vision RAG - Supabase Migration
-- Run this in your Supabase SQL editor to set up the documents table and matching function.

-- Enable the vector extension
create extension if not exists vector;

-- Create the documents table
create table documents (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  title text,
  chunk_index int not null,
  content text not null,
  embedding vector(768),  -- nomic-embed-text dimension
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  unique(url, chunk_index)
);

-- Create an index for vector similarity search
create index on documents using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Create an index for URL lookups
create index on documents (url);

-- Create the match_documents function for similarity search
create or replace function match_documents(
  query_embedding vector(768),
  match_count int default 5
)
returns table (
  id uuid,
  url text,
  title text,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.url,
    documents.title,
    documents.content,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where documents.embedding is not null
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Enable Row Level Security
alter table documents enable row level security;

-- Create a policy that allows anonymous access (adjust for your auth setup)
create policy "Allow anonymous access" on documents
  for all
  using (true)
  with check (true);