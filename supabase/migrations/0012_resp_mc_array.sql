-- resp_mc devient un tableau pour permettre plusieurs responsables MC
alter table public.etapes_projet
  alter column resp_mc type text[] using case when resp_mc is null then null else array[resp_mc] end;

alter table public.etapes_template
  alter column resp_mc type text[] using case when resp_mc is null then null else array[resp_mc] end;
