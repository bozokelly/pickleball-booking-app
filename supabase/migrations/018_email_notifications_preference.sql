-- Add email notification preference to profiles (defaults to true for existing users)
ALTER TABLE profiles ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT TRUE;
