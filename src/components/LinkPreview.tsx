import { ExternalLink, Play, Instagram } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface LinkPreviewProps {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
  type: 'website' | 'youtube' | 'instagram' | 'twitter' | 'other';
}

export const LinkPreview = ({ url, title, description, image, siteName, type }: LinkPreviewProps) => {
  const [showPlayer, setShowPlayer] = useState(false);

  // Extract YouTube video ID
  const getYouTubeId = (youtubeUrl: string): string | null => {
    const regexPatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^\&\?\/\s]{11})/,
      /youtube\.com\/embed\/([^\&\?\/\s]{11})/,
      /youtube\.com\/v\/([^\&\?\/\s]{11})/
    ];
    
    for (const pattern of regexPatterns) {
      const match = youtubeUrl.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (type === 'youtube') {
    const videoId = getYouTubeId(url);
    
    if (videoId && showPlayer) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full rounded-xl overflow-hidden bg-black shadow-lg"
        >
          <div className="relative aspect-video">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0"
            />
          </div>
          <div className="p-3 bg-card border-t border-border">
            <h4 className="text-sm font-semibold text-foreground line-clamp-1 mb-1">
              {title}
            </h4>
            <button
              onClick={() => setShowPlayer(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Collapse
            </button>
          </div>
        </motion.div>
      );
    }

    // Preview card with play button
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md border border-border rounded-xl overflow-hidden bg-card hover:bg-card/80 transition-colors cursor-pointer group"
      >
        {image && (
          <div 
            className="relative aspect-video bg-muted"
            onClick={() => setShowPlayer(true)}
          >
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play size={24} className="text-white ml-1" fill="white" />
              </div>
            </div>
            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              YouTube
            </div>
          </div>
        )}
        <div className="p-4">
          <h4 className="font-semibold text-sm text-foreground line-clamp-2 mb-1">
            {title}
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {description}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ExternalLink size={12} />
            <span>{siteName}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  if (type === 'instagram') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md border border-border rounded-xl overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-4 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={handleClick}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Instagram size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-white line-clamp-1">
              {title}
            </h4>
            <p className="text-xs text-white/80 line-clamp-1">
              {description}
            </p>
            <div className="flex items-center gap-1 text-xs text-white/80 mt-1">
              <ExternalLink size={10} />
              <span>{siteName}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // General website preview
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md border border-border rounded-xl overflow-hidden bg-card hover:bg-card/80 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      {image && (
        <div className="aspect-[16/9] bg-muted overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-4">
        <h4 className="font-semibold text-sm text-foreground line-clamp-2 mb-1">
          {title}
        </h4>
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {description}
          </p>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ExternalLink size={12} />
          <span>{siteName}</span>
        </div>
      </div>
    </motion.div>
  );
};