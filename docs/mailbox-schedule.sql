-- Optional activation. Requires pg_cron, pg_net, and the named Vault secret.
-- Never paste the worker secret into source control or this SQL file.
do $$ begin
 if not exists(select 1 from vault.decrypted_secrets where name='phishaware_mailbox_worker_secret') then
  raise exception 'Create the phishaware_mailbox_worker_secret in Supabase Vault first';
 end if;
end $$;
select cron.schedule('phishaware-mailbox-poll','* * * * *',$job$
 select net.http_post(
  url:='https://lbaqdguqaqgvjrripabj.supabase.co/functions/v1/mailbox-security',
  headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='phishaware_mailbox_worker_secret' limit 1)),
  body:='{"action":"worker"}'::jsonb,
  timeout_milliseconds:=120000
 );
$job$);
