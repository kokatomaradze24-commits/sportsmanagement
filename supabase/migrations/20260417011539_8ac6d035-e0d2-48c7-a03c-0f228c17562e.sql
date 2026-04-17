CREATE OR REPLACE FUNCTION public.admin_storage_stats()
RETURNS TABLE (
  db_bytes BIGINT,
  db_limit_bytes BIGINT,
  storage_bytes BIGINT,
  storage_limit_bytes BIGINT,
  storage_file_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT
    pg_database_size(current_database())::BIGINT AS db_bytes,
    (8::BIGINT * 1024 * 1024 * 1024) AS db_limit_bytes, -- 8 GB free tier
    COALESCE((SELECT SUM((metadata->>'size')::BIGINT) FROM storage.objects), 0)::BIGINT AS storage_bytes,
    (1::BIGINT * 1024 * 1024 * 1024) AS storage_limit_bytes, -- 1 GB free tier
    (SELECT COUNT(*) FROM storage.objects)::BIGINT AS storage_file_count;
END;
$$;