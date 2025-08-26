-- Create trigger for user_gym_photos to set admin_id automatically
CREATE TRIGGER set_admin_id_trigger_gym_photos
    BEFORE INSERT ON user_gym_photos
    FOR EACH ROW
    EXECUTE FUNCTION set_admin_id_on_insert();