export default function Logo({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  };

  return (
    <div className={`${sizes[size]} ${className} flex items-center justify-center`}>
      <div className="relative w-full h-full logo-shimmer logo-glow-pulse rounded-xl">
        <img
          src="https://media.base44.com/images/public/6a2b2ffd9f4e986100520d9a/9f5a60cea_generated_image.png"
          alt="ETRN8"
          className="w-full h-full object-contain rounded-xl"
        />
      </div>
    </div>
  );
}
