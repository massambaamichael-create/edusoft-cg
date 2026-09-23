alter table public.documents
  add column if not exists status text not null default 'draft',
  add column if not exists validated_by uuid references public.users(id),
  add column if not exists validated_at timestamptz,
  add column if not exists signature_name text,
  add column if not exists stamp_applied boolean not null default false,
  add column if not exists verification_code text;

alter table public.generated_documents
  add column if not exists validated_by uuid references public.users(id),
  add column if not exists validated_at timestamptz,
  add column if not exists signature_name text,
  add column if not exists stamp_applied boolean not null default false;

alter table public.documents drop constraint if exists documents_status_check;
alter table public.documents add constraint documents_status_check
  check (status in ('draft','submitted','validated','rejected','archived'));

create unique index if not exists documents_verification_code_uidx
  on public.documents(verification_code) where verification_code is not null;
create index if not exists documents_school_status_idx on public.documents(school_id,status);
create index if not exists generated_documents_school_status_idx on public.generated_documents(school_id,status);

create or replace function public.transition_document_workflow(
  p_document_id uuid,
  p_to_status text,
  p_comment text default null
)
returns public.documents
language plpgsql
security definer
set search_path=public
as $$
declare
  d public.documents;
  actor public.users;
  old_status text;
begin
  select * into d
  from public.documents
  where id=p_document_id and school_id=public.get_my_school_id()
  for update;

  if not found then raise exception 'document_not_found'; end if;
  old_status:=d.status;

  select u.* into actor
  from public.users u
  where u.auth_user_id=auth.uid()
    and u.school_id=d.school_id
    and u.is_active=true
  limit 1;

  if actor.id is null then raise exception 'unauthorized'; end if;
  if p_to_status not in ('submitted','validated','rejected','archived') then raise exception 'invalid_status'; end if;
  if p_to_status='submitted' and d.status not in ('draft','rejected') then raise exception 'invalid_transition'; end if;
  if p_to_status in ('validated','rejected') and d.status<>'submitted' then raise exception 'invalid_transition'; end if;
  if p_to_status='archived' and d.status<>'validated' then raise exception 'invalid_transition'; end if;
  if p_to_status='submitted' and not public.has_permission('documents.upload') then raise exception 'forbidden'; end if;
  if p_to_status in ('validated','rejected','archived') and not public.has_permission('documents.validate') then raise exception 'forbidden'; end if;

  update public.documents
  set status=p_to_status,
      validated_by=case when p_to_status='validated' then actor.id else validated_by end,
      validated_at=case when p_to_status='validated' then now() else validated_at end
  where id=d.id
  returning * into d;

  insert into public.audit_logs(
    school_id,user_id,action,table_name,record_id,old_data,new_data
  )
  values(
    d.school_id,actor.id,'document_workflow:'||p_to_status,'documents',d.id,
    jsonb_build_object('status',old_status,'comment',p_comment),
    jsonb_build_object('status',d.status,'comment',p_comment)
  );

  return d;
end
$$;

revoke all on function public.transition_document_workflow(uuid,text,text) from public;
grant execute on function public.transition_document_workflow(uuid,text,text) to authenticated;
