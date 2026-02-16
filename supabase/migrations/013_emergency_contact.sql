-- Add emergency contact fields to profiles
ALTER TABLE profiles ADD COLUMN emergency_contact_name text;
ALTER TABLE profiles ADD COLUMN emergency_contact_phone text;
