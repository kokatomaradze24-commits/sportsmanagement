-- Revoke EXECUTE on SECURITY DEFINER functions from PUBLIC/anon to prevent
-- unauthenticated execution. Admin functions remain callable by authenticated
-- users because they self-gate via has_role(); non-admin helpers and trigger
-- functions are revoked from authenticated as well since they are only invoked
-- by triggers or by the service-role server runtime.

-- Helpers used by RLS (RLS continues to work via definer privileges)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_subscription_active(uuid) FROM PUBLIC, anon;

-- Trigger / internal functions: not meant to be called by clients
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_player_created() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_player_payments(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_overdue_payments() FROM PUBLIC, anon, authenticated;

-- Credit functions: only invoked from the server runtime via service role
REVOKE EXECUTE ON FUNCTION public.deduct_ai_credits(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refund_ai_credits(uuid, integer) FROM PUBLIC, anon, authenticated;

-- Admin functions: self-gated via has_role(); revoke from anon only
REVOKE EXECUTE ON FUNCTION public.admin_deactivate_subscription(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_subscription_revenue() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_toggle_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_extend_subscription(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_ai_purchases() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_storage_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;