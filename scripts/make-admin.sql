-- Promove um utilizador a admin (corre no SQL Editor do Supabase
-- DEPOIS de a pessoa se registar via Authentication).
-- Substitui o email:
update public.profiles
set role = 'admin'
where email = 'infocarloscarmo@gmail.com';
