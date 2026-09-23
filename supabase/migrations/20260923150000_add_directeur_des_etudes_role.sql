-- Add the pedagogical leadership role defined by the EduSoft CG PRD.
insert into public.roles (name)
select 'Directeur des Études'
where not exists (select 1 from public.roles where name = 'Directeur des Études');

with role_row as (
  select id from public.roles where name = 'Directeur des Études' limit 1
),
codes(code) as (
  values
    ('dashboard.read'),
    ('classes.read'),('classes.manage'),
    ('subjects.read'),('subjects.manage'),
    ('planning.read'),('planning.manage'),
    ('teacher_assignments.read'),('teacher_assignments.manage'),
    ('assessments.read'),('assessments.manage'),
    ('grades.read'),('grades.write'),
    ('report_cards.read'),('report_cards.manage'),
    ('exams.read'),('exams.manage'),
    ('exam_authorizations.read'),('exam_authorizations.manage'),
    ('documents.read'),('documents.generate'),
    ('communication.read')
)
insert into public.role_permissions (school_id, role_id, permission_id, granted)
select s.id, r.id, p.id, true
from public.schools s
cross join role_row r
join codes c on true
join public.permissions p on p.code = c.code
where not exists (
  select 1
  from public.role_permissions rp
  where rp.school_id=s.id and rp.role_id=r.id and rp.permission_id=p.id
);