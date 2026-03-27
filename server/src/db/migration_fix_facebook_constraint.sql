-- Migration: Update link_type constraint to include Facebook
-- Run this if you get a constraint violation for 'facebook' link type

-- Drop the old constraint
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_link_type_check;

-- Add the new constraint with Facebook support
ALTER TABLE messages 
ADD CONSTRAINT messages_link_type_check 
CHECK (link_type IN ('website', 'youtube', 'instagram', 'facebook', 'twitter', 'other'));