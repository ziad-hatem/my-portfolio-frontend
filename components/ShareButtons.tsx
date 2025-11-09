'use client';

import React from 'react';
import { Share2, Linkedin, Facebook, Link2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Analytics } from '../utils/analytics';

interface ShareButtonsProps {
  title: string;
  url?: string;
  itemId?: string | number;
  itemType?: 'project' | 'post';
}

export function ShareButtons({ title, url, itemId, itemType }: ShareButtonsProps) {
  const [copied, setCopied] = React.useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const trackShare = (platform: string) => {
    if (itemId && itemType) {
      Analytics.track({
        type: 'share_click',
        itemId,
        itemTitle: title,
        metadata: {
          platform,
          itemType,
        },
      });
    }
  };

  const handleCopyLink = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      toast.error('Clipboard not supported');
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      trackShare('copy_link');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const shareLinks = [
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: 'hover:text-[#0077B5]',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'hover:text-[#1877F2]',
    },
    {
      name: 'Twitter',
      icon: Share2,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: 'hover:text-[#1DA1F2]',
    },
  ];

  return (
    <div className="flex items-center gap-4">
      <span className="text-muted-foreground text-sm">Share:</span>
      <div className="flex items-center gap-2">
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackShare(link.name.toLowerCase())}
            className={`w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground transition-all hover:bg-accent/10 ${link.color}`}
            aria-label={`Share on ${link.name}`}
          >
            <link.icon size={18} />
          </a>
        ))}
        <button
          onClick={handleCopyLink}
          className={`w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center transition-all hover:bg-accent/10 ${
            copied ? 'text-accent' : 'text-muted-foreground hover:text-accent'
          }`}
          aria-label="Copy link"
        >
          {copied ? <Check size={18} /> : <Link2 size={18} />}
        </button>
      </div>
    </div>
  );
}
