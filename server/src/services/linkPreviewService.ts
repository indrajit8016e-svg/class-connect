import axios from 'axios';
import * as cheerio from 'cheerio';

export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
  type: 'website' | 'youtube' | 'instagram' | 'twitter' | 'other';
}

export class LinkPreviewService {
  private static readonly USER_AGENT = 'Mozilla/5.0 (compatible; ClassConnect/1.0)';

  static async generatePreview(url: string): Promise<LinkPreview | null> {
    try {
      // Check if it's a YouTube URL
      const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (youtubeMatch) {
        return this.getYouTubePreview(url, youtubeMatch[1]);
      }

      // Check if it's an Instagram URL
      if (url.includes('instagram.com')) {
        return this.getInstagramPreview(url);
      }

      // For other URLs, try to fetch Open Graph data
      return await this.getOpenGraphPreview(url);
    } catch (error) {
      console.error('Error generating link preview:', error);
      return null;
    }
  }

  private static async getYouTubePreview(url: string, videoId: string): Promise<LinkPreview | null> {
    try {
      // Use YouTube's oEmbed API for better data
      const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const response = await axios.get(oEmbedUrl, {
        headers: { 'User-Agent': this.USER_AGENT },
        timeout: 5000
      });

      const data = response.data;
      return {
        url,
        title: data.title || 'YouTube Video',
        description: data.author_name ? `By ${data.author_name}` : 'YouTube Video',
        image: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        siteName: 'YouTube',
        type: 'youtube'
      };
    } catch (error) {
      // Fallback to basic YouTube preview
      return {
        url,
        title: 'YouTube Video',
        description: 'Watch this video on YouTube',
        image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        siteName: 'YouTube',
        type: 'youtube'
      };
    }
  }

  private static async getInstagramPreview(url: string): Promise<LinkPreview | null> {
    // Instagram doesn't provide oEmbed for posts, so we'll create a basic preview
    // In a real implementation, you might want to use Instagram's Graph API
    return {
      url,
      title: 'Instagram Post',
      description: 'View this post on Instagram',
      image: '', // Instagram doesn't allow direct image access
      siteName: 'Instagram',
      type: 'instagram'
    };
  }

  private static async getOpenGraphPreview(url: string): Promise<LinkPreview | null> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 5000,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      const title = $('meta[property="og:title"]').attr('content') ||
                   $('title').text() ||
                   $('meta[name="title"]').attr('content') ||
                   'Link Preview';

      const description = $('meta[property="og:description"]').attr('content') ||
                         $('meta[name="description"]').attr('content') ||
                         '';

      const image = $('meta[property="og:image"]').attr('content') ||
                   $('meta[property="og:image:url"]').attr('content') ||
                   '';

      const siteName = $('meta[property="og:site_name"]').attr('content') ||
                      new URL(url).hostname;

      return {
        url,
        title: title.substring(0, 200), // Limit title length
        description: description.substring(0, 300), // Limit description length
        image,
        siteName,
        type: 'website'
      };
    } catch (error) {
      console.error('Error fetching Open Graph data:', error);
      return null;
    }
  }

  static extractUrls(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches || [];
  }
}