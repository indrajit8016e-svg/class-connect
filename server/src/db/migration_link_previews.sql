-- Migration: Add link preview fields to messages table
-- This migration adds support for link previews and embedded media

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS link_url TEXT,
ADD COLUMN IF NOT EXISTS link_title TEXT,
ADD COLUMN IF NOT EXISTS link_description TEXT,
ADD COLUMN IF NOT EXISTS link_image TEXT,
ADD COLUMN IF NOT EXISTS link_site_name TEXT,
ADD COLUMN IF NOT EXISTS link_type TEXT CHECK (link_type IN ('website', 'youtube', 'instagram', 'facebook', 'twitter', 'other')) DEFAULT 'website';

-- Create index for better query performance on link previews
CREATE INDEX IF NOT EXISTS idx_messages_link_url ON messages(link_url) WHERE link_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_link_type ON messages(link_type) WHERE link_type IS NOT NULL;