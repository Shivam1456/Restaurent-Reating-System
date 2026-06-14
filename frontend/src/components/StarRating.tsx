import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  onChange?: (newRating: number) => void;
  size?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  onChange,
  size = 24
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleMouseEnter = (index: number) => {
    if (onChange) setHoverRating(index);
  };

  const handleMouseLeave = () => {
    if (onChange) setHoverRating(null);
  };

  const handleClick = (index: number) => {
    if (onChange) onChange(index);
  };

  const currentDisplayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxStars }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= currentDisplayRating;
        const isInteractive = !!onChange;

        return (
          <button
            key={i}
            type="button"
            className={`${
              isInteractive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            } star-transition focus:outline-none`}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(starValue)}
            disabled={!isInteractive}
          >
            <Star
              size={size}
              className={`${
                isFilled
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-300 dark:text-slate-600 fill-transparent'
              } transition-colors duration-150`}
            />
          </button>
        );
      })}
    </div>
  );
};
export default StarRating;
