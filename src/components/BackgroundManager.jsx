import ParticlesBackground from './ParticlesBackground';

export default function BackgroundManager({ 
  mode, 
  imageList, 
  currentIndex,
  // onPrev and onNext are no longer used – removed from props
}) {
  const currentItem = imageList[currentIndex % imageList.length] || {};
  const base = import.meta.env.BASE_URL || '/';
  const imageUrl = mode === 'image' && currentItem.filename
    ? `${base}data/images/image_gallery/travel_destinations/${currentItem.filename}`
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
