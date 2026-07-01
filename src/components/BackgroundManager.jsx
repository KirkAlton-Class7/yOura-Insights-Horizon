import { useEffect, useState } from 'react';
import ParticlesBackground from './ParticlesBackground';

const MOBILE_IMAGE_QUERY = '(max-width: 767px), (hover: none) and (pointer: coarse)';

function useMobileImage() {
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia(MOBILE_IMAGE_QUERY).matches
  ));

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_IMAGE_QUERY);
    const updateMatch = () => setIsMobile(mediaQuery.matches);
    updateMatch();
    mediaQuery.addEventListener('change', updateMatch);
    return () => mediaQuery.removeEventListener('change', updateMatch);
  }, []);

  return isMobile;
}

export default function BackgroundManager({ 
  mode, 
  imageList, 
  currentIndex,
  // onPrev and onNext are no longer used – removed from props
}) {
  const isMobile = useMobileImage();
  const currentItem = imageList[currentIndex % imageList.length] || {};
  const base = import.meta.env.BASE_URL || '/';
  const upscaledFilename = currentItem.filename?.replace(/\.webp$/i, '-sharpen-upscale-4x.webp');
  const originalImageUrl = currentItem.filename
    ? `${base}data/images/image_gallery/original/${currentItem.filename}`
    : '';
  const desktopImageUrl = upscaledFilename
    ? `${base}data/images/image_gallery/upscaled/${upscaledFilename}`
    : '';
  const imageUrl = mode === 'image'
    ? (isMobile ? originalImageUrl : desktopImageUrl)
    : '';

  if (mode === 'particles') {
    return <ParticlesBackground />;
  }

  const location = currentItem.location || 'Unknown location';
  const total = imageList.length;
  const indexDisplay = total ? `${currentIndex + 1} / ${total}` : '';

  return (
    <div className="fixed inset-0 z-0">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={currentItem.title || 'Background'}
          className="w-full h-full object-cover"
          decoding="async"
          onError={(event) => {
            if (!isMobile && originalImageUrl && !event.currentTarget.dataset.fallbackApplied) {
              event.currentTarget.dataset.fallbackApplied = 'true';
              event.currentTarget.src = originalImageUrl;
            }
          }}
        />
      ) : (
        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
          <p className="text-white/40">No images available</p>
        </div>
      )}

      {/* Location & index pill – at the very bottom (bottom-4) */}
      {total > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-4 py-2 rounded-full pointer-events-none z-20 backdrop-blur-sm border border-white/10 whitespace-nowrap">
          {location} {indexDisplay && `• ${indexDisplay}`}
        </div>
      )}
    </div>
  );
}
