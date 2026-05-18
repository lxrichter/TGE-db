-- Align app user roles with the MVP role model:
-- researcher, editor, senior_editor, admin.

ALTER TABLE app_users
  DROP CONSTRAINT IF EXISTS app_users_role_code_check;

UPDATE app_users
SET role_code = CASE role_code
  WHEN 'viewer' THEN 'researcher'
  WHEN 'analyst' THEN 'researcher'
  WHEN 'reviewer' THEN 'senior_editor'
  WHEN 'editor_export' THEN 'senior_editor'
  WHEN 'editor_plus' THEN 'senior_editor'
  WHEN 'editor+' THEN 'senior_editor'
  WHEN 'administrator' THEN 'admin'
  ELSE role_code
END;

ALTER TABLE app_users
  ADD CONSTRAINT app_users_role_code_check
  CHECK (role_code IN ('researcher', 'editor', 'senior_editor', 'admin'));
