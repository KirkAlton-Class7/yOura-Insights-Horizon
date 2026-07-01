import ParticlesBackground from './ParticlesBackground';

export default function BackgroundManager({ 
  mode, 
  imageList, 
  currentIndex,
  // onPrev and onNext are no longer used – removed from props
}) {
  const currentItem = imageList[currentIndex % imageList.length] || {};
  const base = import.meta.env.BASE_URL || '/';
  const upscaledFilename = currentItem.filename?.replace(/\.webp$/i, '-sharpen-upscale-4x.webp');
  const desktopImageUrl = mode === 'image' && upscaledFilename
    ? `${base}data/images/image_gallery/upscaled/${upscaledFilename}`
    : '';

  if (mode === 'particles') {
    return <ParticlesBackground />;
  }

  const fallbackImageUrl = currentItem.filename
    ? `${base}data/images/image_gallery/${currentItem.filename}`
    : '';
  const location = currentItem.location || 'Unknown location';
  const total = imageList.length;
  const indexDisplay = total ? `${currentIndex + 1} / ${total}` : '';

  return (
    <div className="fixed inset-0 z-0">
      {desktopImageUrl ? (
        <picture className="block w-full h-full">
          {fallbackImageUrl && <source media="(max-width: 767px)" srcSet={fallbackImageUrl} />}
          <img
            src={desktopImageUrl}
            alt={currentItem.title || 'Background'}
            className="w-full h-full object-cover"
            decoding="async"
            onError={(event) => {
              if (fallbackImageUrl && event.currentTarget.src !== fallbackImageUrl) {
                event.currentTarget.onerror = null;
                event.currentTarget.src = fallbackImageUrl;
              }
            }}
          />
        </picture>
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
