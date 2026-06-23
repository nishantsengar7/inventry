const SIZE_MAP = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-4',
};

export default function LoadingSpinner({ size = 'md', fullScreen = false }) {
  const spinner = (
    <div
      className={`${SIZE_MAP[size]} border-indigo-200 border-t-indigo-600 rounded-full animate-spin`}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/70 z-50">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-10">
      {spinner}
    </div>
  );
}
