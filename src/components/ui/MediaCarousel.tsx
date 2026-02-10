import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './MediaCarousel.css'

interface MediaItem {
    media_url: string
    media_type: 'image' | 'video'
}

interface MediaCarouselProps {
    media: MediaItem[]
    aspectRatio?: 'square' | 'video' | 'portrait'
}

export function MediaCarousel({ media, aspectRatio = 'square' }: MediaCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const scrollRef = useRef<HTMLDivElement>(null)

    if (!media || media.length === 0) return null

    const handlePrevious = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
        }
    }

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (currentIndex < media.length - 1) {
            setCurrentIndex(currentIndex + 1)
        }
    }

    useEffect(() => {
        if (scrollRef.current) {
            const width = scrollRef.current.offsetWidth
            scrollRef.current.scrollTo({
                left: currentIndex * width,
                behavior: 'smooth'
            })
        }
    }, [currentIndex])

    return (
        <div className={`media-carousel carousel-${aspectRatio}`}>
            <div className="carousel-track" ref={scrollRef}>
                {media.map((item, index) => (
                    <div key={index} className="carousel-item">
                        {item.media_type === 'video' ? (
                            <video
                                src={item.media_url}
                                controls
                                className="carousel-media"
                                playsInline
                            />
                        ) : (
                            <img
                                src={item.media_url}
                                alt={`Media ${index + 1}`}
                                className="carousel-media"
                                loading="lazy"
                            />
                        )}
                    </div>
                ))}
            </div>

            {media.length > 1 && (
                <>
                    {currentIndex > 0 && (
                        <button
                            className="carousel-btn prev"
                            onClick={handlePrevious}
                            aria-label="Previous"
                        >
                            <ChevronLeft size={24} />
                        </button>
                    )}
                    {currentIndex < media.length - 1 && (
                        <button
                            className="carousel-btn next"
                            onClick={handleNext}
                            aria-label="Next"
                        >
                            <ChevronRight size={24} />
                        </button>
                    )}
                    <div className="carousel-indicators">
                        {media.map((_, index) => (
                            <div
                                key={index}
                                className={`indicator ${index === currentIndex ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setCurrentIndex(index)
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
