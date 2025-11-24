import { useState } from 'react';
import { Image, Video, FileText } from 'lucide-react';

interface MediaDisplayProps {
  src: string;
  alt: string;
  mediaType: 'image' | 'video' | 'text';
  className?: string;
  controls?: boolean;
}

export function MediaDisplay({ src, alt, mediaType, className = '', controls = false }: MediaDisplayProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const getMediaUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    // Always use full URL for production domain
    if (window.location.hostname === 'gandharvafin.com' || window.location.hostname.includes('gandharvafin')) {
      return `https://gandharvafin.com${url.startsWith('/') ? url : '/' + url}`;
    }
    return url;
  };

  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  const handleLoad = () => {
    setLoading(false);
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded ${className}`}>
        <div className="text-center p-4">
          {mediaType === 'image' && <Image className="h-8 w-8 mx-auto mb-2 text-gray-400" />}
          {mediaType === 'video' && <Video className="h-8 w-8 mx-auto mb-2 text-gray-400" />}
          {mediaType === 'text' && <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />}
          <p className="text-xs text-gray-500">Media unavailable</p>
        </div>
      </div>
    );
  }

  if (mediaType === 'image') {
    return (
      <div className="relative">
        {loading && (
          <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 rounded ${className}`}>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        )}
        <img
          src={getMediaUrl(src)}
          alt={alt}
          className={className}
          onError={handleError}
          onLoad={handleLoad}
          style={{ display: loading ? 'none' : 'block' }}
        />
      </div>
    );
  }

  if (mediaType === 'video') {
    return (
      <div className="relative">
        {loading && (
          <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 rounded ${className}`}>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        )}
        <video
          src={getMediaUrl(src)}
          className={className}
          controls={controls}
          onError={handleError}
          onLoadedData={handleLoad}
          style={{ display: loading ? 'none' : 'block' }}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center bg-gray-100 rounded ${className}`}>
      <FileText className="h-8 w-8 text-gray-400" />
    </div>
  );
}