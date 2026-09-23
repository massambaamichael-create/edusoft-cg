-- Keep document workflow notifications server-side and tied to the same workflow transaction.

create or replace function public.transition_document_workflow(
  p_document_id uuid,
  p_to_status text,
  p_comment text default null
)
returns public.documents
language plpgsql
security definer
set search_path=public
as $function$
declare
  d public.documents;
  actor public.users;
  actor_role text;
  old_status text;
  notification_title text;
  notification_message text;
begin
  select * into d from public.documents
  where id=p_document_id and school_id=public.get_my_school_id()
  for update;
  if not found then raise exception 'document_not_found'; end if;

  old_status:=d.status;
  select u.* into actor from public.users u
  where u.auth_user_id=auth.uid() and u.school_id=d.school_id and u.is_active=true limit 1;
  select ro.name into actor_role from public.roles ro where ro.id=actor.role_id;

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
  where id=d.id returning * into d;

  if p_to_status='archived' then
    insert into public.archives(school_id,table_name,record_id,archived_by)
    values(d.school_id,'documents',d.id,actor.id);
  end if;

  insert into public.audit_logs(school_id,user_id,action,table_name,record_id,old_data,new_data)
  values(d.school_id,actor.id,'document_workflow:'||p_to_status,'documents',d.id,
    jsonb_build_object('status',old_status,'comment',p_comment),
    jsonb_build_object('status',d.status,'comment',p_comment));

  if d.uploaded_by is not null and p_to_status in ('validated','rejected','archived') then
    notification_title := case
      when p_to_status='validated' then 'Document validé'
      when p_to_status='rejected' then 'Document rejeté'
      else 'Document archivé'
    end;
    notification_message := case
      when p_to_status='validated' then 'Votre document « '||coalesce(d.title,d.document_type,'Document')||' » a été validé.'
      when p_to_status='rejected' then 'Votre document « '||coalesce(d.title,d.document_type,'Document')||' » a été rejeté.'
      else 'Votre document « '||coalesce(d.title,d.document_type,'Document')||' » a été archivé.'
    end;
    insert into public.notifications(school_id,user_id,title,message,is_read)
    values(d.school_id,d.uploaded_by,notification_title,notification_message,false);
  end if;

  return d;
end
$function$;
