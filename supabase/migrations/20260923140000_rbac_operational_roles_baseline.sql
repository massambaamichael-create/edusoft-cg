-- RBAC baseline for operational roles. Least privilege; Director remains the full-control role.
with role_map as (
  select id,name from public.roles where name in (
    'Administrateur','Comptable','RH','Infirmerie','Secrétaire','Surveillant','Parent','Élève'
  )
),
perm_map as (
  select id,code from public.permissions
),
grants(role_name, code) as (
  values
    ('Administrateur','dashboard.read'),
    ('Administrateur','students.read'),('Administrateur','students.create'),('Administrateur','students.update'),('Administrateur','students.archive'),
    ('Administrateur','parents.read'),('Administrateur','parents.manage'),
    ('Administrateur','enrollments.read'),('Administrateur','enrollments.manage'),
    ('Administrateur','teachers.read'),('Administrateur','teachers.manage'),
    ('Administrateur','classes.read'),('Administrateur','subjects.read'),('Administrateur','subjects.manage'),
    ('Administrateur','documents.read'),('Administrateur','documents.upload'),('Administrateur','documents.generate'),
    ('Administrateur','communication.read'),('Administrateur','communication.send'),('Administrateur','settings.read'),
    ('Secrétaire','dashboard.read'),
    ('Secrétaire','students.read'),('Secrétaire','students.create'),('Secrétaire','students.update'),
    ('Secrétaire','parents.read'),('Secrétaire','parents.manage'),
    ('Secrétaire','enrollments.read'),('Secrétaire','enrollments.manage'),
    ('Secrétaire','teachers.read'),('Secrétaire','classes.read'),
    ('Secrétaire','documents.read'),('Secrétaire','documents.upload'),('Secrétaire','documents.generate'),
    ('Secrétaire','communication.read'),('Secrétaire','communication.send'),
    ('Comptable','dashboard.read'),('Comptable','finance.read'),('Comptable','finance.manage'),
    ('Comptable','payments.create'),('Comptable','financial_reports.read'),
    ('Comptable','students.read'),('Comptable','parents.read'),('Comptable','enrollments.read'),
    ('Comptable','documents.read'),('Comptable','communication.read'),
    ('RH','dashboard.read'),('RH','hr.read'),('RH','hr.manage'),
    ('RH','teachers.read'),('RH','teachers.manage'),
    ('RH','documents.read'),('RH','documents.upload'),('RH','documents.generate'),('RH','communication.read'),
    ('Infirmerie','dashboard.read'),('Infirmerie','health.read'),('Infirmerie','health.manage'),
    ('Infirmerie','students.read'),('Infirmerie','documents.read'),
    ('Surveillant','dashboard.read'),('Surveillant','students.read'),
    ('Surveillant','attendance.read'),('Surveillant','attendance.write'),
    ('Surveillant','discipline.read'),('Surveillant','discipline.manage'),
    ('Surveillant','communication.read'),('Surveillant','communication.send'),
    ('Parent','portal.parent.read'),
    ('Élève','portal.student.read')
)
insert into public.role_permissions (school_id, role_id, permission_id, granted)
select s.id, r.id, p.id, true
from public.schools s
join grants g on true
join role_map r on r.name=g.role_name
join perm_map p on p.code=g.code
where not exists (
  select 1 from public.role_permissions rp
  where rp.school_id=s.id and rp.role_id=r.id and rp.permission_id=p.id
);

update public.role_permissions rp
set granted=true, updated_at=now()
from public.roles r, public.permissions p
where rp.role_id=r.id and rp.permission_id=p.id
  and r.name in ('Administrateur','Comptable','RH','Infirmerie','Secrétaire','Surveillant','Parent','Élève')
  and rp.granted is distinct from true;
