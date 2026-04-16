-- Replace the broad public SELECT policy with an owner-only policy.
-- The bucket remains public, so individual file reads via the public CDN URL continue to work.
DROP POLICY IF EXISTS "Logos are publicly readable" ON storage.objects;

CREATE POLICY "Users can list their own logo"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);