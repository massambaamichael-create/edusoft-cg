create or replace function public.recalculate_assessment_correction(p_session_id uuid)
returns public.assessment_correction_sessions
language plpgsql
security definer
set search_path = public
as $function$
declare
  s public.assessment_correction_sessions;
  item_max numeric;
  item_score numeric;
  a public.assessments;
  me_teacher uuid;
begin
  select * into s from public.assessment_correction_sessions
  where id = p_session_id and school_id = public.get_my_school_id();
  if not found then raise exception 'Correction introuvable'; end if;

  select * into a from public.assessments
  where id = s.assessment_id and school_id = public.get_my_school_id();

  select t.id into me_teacher
  from public.teachers t join public.users u on u.id=t.user_id
  where u.auth_user_id=auth.uid() limit 1;

  if public.get_my_role() not in ('Directeur','Directeur des Études')
     and (a.teacher_id is distinct from me_teacher or not public.has_permission('grades.write')) then
    raise exception 'Accès refusé';
  end if;

  select coalesce(sum(max_score),0), coalesce(sum(awarded_score),0)
  into item_max,item_score
  from public.assessment_correction_items
  where correction_session_id=p_session_id;

  update public.assessment_correction_sessions
  set total_score=item_score,
      max_score=case when item_max>0 then item_max else max_score end,
      normalized_score=case when item_max>0 then round(item_score/item_max*20,2) else item_score end,
      updated_at=now()
  where id=p_session_id;

  select * into s from public.assessment_correction_sessions where id=p_session_id;
  return s;
end;
$function$;

create or replace function public.transition_assessment_correction(p_session_id uuid, p_to_status text, p_comment text default null)
returns public.assessment_correction_sessions
language plpgsql
security definer
set search_path = public
as $function$
declare
  s public.assessment_correction_sessions;
  a public.assessments;
  me_user uuid;
  me_teacher uuid;
begin
  select * into s from public.assessment_correction_sessions
  where id=p_session_id and school_id=public.get_my_school_id();
  if not found then raise exception 'Correction introuvable'; end if;

  select * into a from public.assessments
  where id=s.assessment_id and school_id=public.get_my_school_id();

  me_user := public.get_my_user_id();
  select t.id into me_teacher
  from public.teachers t join public.users u on u.id=t.user_id
  where u.auth_user_id=auth.uid() limit 1;

  if public.get_my_role() not in ('Directeur','Directeur des Études')
     and (a.teacher_id is distinct from me_teacher or not public.has_permission('grades.write')) then
    raise exception 'Accès refusé';
  end if;

  if s.status='draft' and p_to_status='submitted' then
    update public.assessment_correction_sessions
    set status='submitted',submitted_at=now(),corrected_by=me_user,
        feedback=coalesce(p_comment,feedback),updated_at=now()
    where id=s.id;
  elsif s.status='submitted' and p_to_status in ('validated','rejected') then
    if public.get_my_role() not in ('Directeur','Directeur des Études') then
      raise exception 'Validation réservée à la direction pédagogique';
    end if;

    update public.assessment_correction_sessions
    set status=p_to_status,
        validated_at=case when p_to_status='validated' then now() else null end,
        validated_by=case when p_to_status='validated' then me_user else null end,
        feedback=coalesce(p_comment,feedback),updated_at=now()
    where id=s.id;

    if p_to_status='validated' then
      insert into public.grades(
        assessment_id,student_id,score,appreciation,school_id,status,calculation_excluded
      )
      values(
        s.assessment_id,s.student_id,s.normalized_score,s.feedback,s.school_id,'graded',false
      )
      on conflict(assessment_id,student_id) do update
      set score=excluded.score,appreciation=excluded.appreciation,
          status='graded',calculation_excluded=false,updated_at=now();
    end if;
  elsif s.status='rejected' and p_to_status='draft' then
    if public.get_my_role() not in ('Directeur','Directeur des Études') then
      raise exception 'Réouverture réservée à la direction pédagogique';
    end if;
    update public.assessment_correction_sessions set status='draft',updated_at=now() where id=s.id;
  else
    raise exception 'Transition de correction non autorisée';
  end if;

  select * into s from public.assessment_correction_sessions where id=p_session_id;
  return s;
end;
$function$;
