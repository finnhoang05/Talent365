"use client";

import { useCallback, useEffect, useRef } from "react";
import { Play } from "lucide-react";
import { isYouTubeUrl } from "@/lib/video-utils";

interface JobVideoVisualProps {
  videoUrl: string | null | undefined;
  companyName: string | null | undefined;
  accentColor: string;
  isSelected?: boolean;
}

export function JobVideoVisual({
  videoUrl,
  companyName,
  accentColor,
  isSelected = false,
}: JobVideoVisualProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isSelected) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isSelected]);

  if (videoUrl && !isYouTubeUrl(videoUrl)) {
    return (
      <div className={`video-visual ${accentColor}`}>
        <video 
          ref={videoRef} 
          src={videoUrl} 
          muted 
          playsInline 
          loop
          preload="metadata"
        />
        {!isSelected && (
          <div className="play-button large">
            <Play size={48} fill="currentColor" />
          </div>
        )}
      </div>
    );
  }

  // Placeholder gradient background when no video
  return (
    <div className={`video-visual ${accentColor}`}>
      <div className="play-button large">
        <Play size={48} fill="currentColor" />
      </div>
    </div>
  );
}
