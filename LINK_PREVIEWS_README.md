# Link Previews & Embedded Media

This feature allows users to share YouTube videos, Instagram posts, and website links with rich previews directly in chat messages.

## Features

### 🎥 YouTube Video Previews
- Automatic thumbnail extraction
- Video title and channel information
- Click to open video in new tab
- Embedded player styling

### 📸 Instagram Post Previews
- Instagram branding with gradient styling
- Direct link to original post
- Optimized for mobile viewing

### 🌐 Website Link Previews
- Open Graph metadata extraction
- Title, description, and thumbnail
- Favicon and site name display
- Responsive design

## Technical Implementation

### Database Schema
New columns added to `messages` table:
- `link_url` - Original URL
- `link_title` - Preview title
- `link_description` - Preview description
- `link_image` - Preview image/thumbnail
- `link_site_name` - Source site name
- `link_type` - Content type (youtube/instagram/website)

### Backend Processing
- Automatic URL detection in message content
- Metadata extraction using Open Graph protocol
- YouTube oEmbed API integration
- Instagram basic preview support
- Error handling and fallbacks

### Frontend Display
- `LinkPreview` component with type-specific styling
- Responsive design for all screen sizes
- Smooth animations and hover effects
- Click-to-open functionality

## Usage

Simply paste a URL in any chat message:

```
Check out this amazing tutorial: https://youtube.com/watch?v=dQw4w9WgXcQ
```

The system will automatically:
1. Detect the URL
2. Generate a rich preview
3. Display it below the message text

## Supported Platforms

- **YouTube**: Full video previews with thumbnails
- **Instagram**: Post previews with Instagram branding
- **Twitter**: Link previews (via Open Graph)
- **Any Website**: Generic link previews using Open Graph tags

## Migration

Run the migration to add link preview support to existing installations:

```sql
-- Run: server/src/db/migration_link_previews.sql
ALTER TABLE messages ADD COLUMN IF NOT EXISTS link_url TEXT;
-- ... (other columns)
```

## Dependencies Added

- `axios`: HTTP requests for metadata fetching
- `cheerio`: HTML parsing for Open Graph extraction

## API Endpoints

No new endpoints required - link previews are automatically generated when creating messages via the existing `/api/messages` POST endpoint.