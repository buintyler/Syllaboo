-- Atomic RPC: create child profile and mark onboarding complete in one transaction
CREATE OR REPLACE FUNCTION create_child_profile_and_complete_onboarding(
  p_parent_id uuid,
  p_display_name text,
  p_avatar_id text,
  p_reading_level int DEFAULT 1
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  INSERT INTO child_profiles (parent_id, display_name, avatar_id, reading_level)
  VALUES (p_parent_id, p_display_name, p_avatar_id, p_reading_level)
  RETURNING id INTO v_profile_id;

  UPDATE users
  SET onboarding_complete = true
  WHERE id = p_parent_id;

  RETURN v_profile_id;
END;
$$;
