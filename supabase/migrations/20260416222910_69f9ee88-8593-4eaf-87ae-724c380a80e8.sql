-- No schema change needed: app_settings already supports arbitrary key/value per user.
-- We'll store sport as key='sport', value='basketball' (etc.)
-- This migration is a no-op marker.
SELECT 1;