import { ExternalLink, Play, Instagram, Facebook } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface LinkPreviewProps {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
  type: 'website' | 'youtube' | 'instagram' | 'facebook' | 'twitter' | 'other';
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
    if (showPlayer) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md rounded-xl overflow-hidden shadow-lg"
        >
          <div className="bg-card p-4 border border-border rounded-t-xl">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              {title}
            </h4>
            <button
              onClick={() => setShowPlayer(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Collapse
            </button>
          </div>
          <div className="bg-black flex justify-center p-2">
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-center">
              <div className="max-w-sm bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-lg p-8 flex items-center justify-center">
                <div className="text-center">
                  <Instagram size={48} className="text-white mb-2 mx-auto" />
                  <p className="text-white font-semibold text-sm">Open on Instagram</p>
                  <p className="text-white/70 text-xs mt-1">Click to view full post</p>
                </div>
              </div>
            </a>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md border border-border rounded-xl overflow-hidden bg-card hover:bg-card/80 transition-colors cursor-pointer group"
      >
        <div 
          className="relative aspect-square bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center"
          onClick={() => setShowPlayer(true)}
        >
          <div className="text-center group-hover:scale-110 transition-transform">
            <Instagram size={48} className="text-white mb-2 mx-auto" />
            <p className="text-white font-semibold text-sm">View Post</p>
          </div>
        </div>
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

  if (type === 'facebook') {
    if (showPlayer) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md rounded-xl overflow-hidden shadow-lg"
        >
          <div className="bg-card p-4 border border-border rounded-t-xl">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              {title}
            </h4>
            <button
              onClick={() => setShowPlayer(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Collapse
            </button>
          </div>
          <div className="bg-slate-100 dark:bg-slate-900 flex justify-center p-2">
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-center">
              <div className="max-w-sm bg-blue-600 rounded-lg p-8 flex items-center justify-center">
                <div className="text-center">
                  <Facebook size={48} className="text-white mb-2 mx-auto" fill="white" />
                  <p className="text-white font-semibold text-sm">Open on Facebook</p>
                  <p className="text-white/70 text-xs mt-1">Click to view full post</p>
                </div>
              </div>
            </a>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md border border-border rounded-xl overflow-hidden bg-card hover:bg-card/80 transition-colors cursor-pointer group"
      >
        <div 
          className="relative aspect-square bg-blue-600 flex items-center justify-center"
          onClick={() => setShowPlayer(true)}
        >
          <div className="text-center group-hover:scale-110 transition-transform">
            <Facebook size={48} className="text-white mb-2 mx-auto" fill="white" />
            <p className="text-white font-semibold text-sm">View Post</p>
          </div>
        </div>
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