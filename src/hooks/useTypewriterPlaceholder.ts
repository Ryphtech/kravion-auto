'use client';

import { useState, useEffect } from 'react';

export const DEFAULT_SEARCH_SUGGESTIONS = [
  'Carbon Splitters',
  'Ambient Lighting',
  'Valvetronic Exhaust',
  'Audi Matrix LED',
  'Burmester 3D Audio',
  'GT Spoilers & Wings',
  'BMW M Exhaust',
  'Alcantara Steering',
  'Rear Diffusers',
  'Forged Carbon Kits',
];

/**
 * Custom hook that creates an automatic typewriter effect cycling through
 * luxury automotive search queries for animated search bar placeholders.
 */
export function useTypewriterPlaceholder(
  suggestions: string[] = DEFAULT_SEARCH_SUGGESTIONS,
  typingSpeed = 55,
  deletingSpeed = 30,
  pauseDuration = 2200
): string {
  const [displayText, setDisplayText] = useState('');
  const [suggestionIdx, setSuggestionIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!suggestions || suggestions.length === 0) return;

    const current = suggestions[suggestionIdx % suggestions.length];
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (displayText.length < current.length) {
        timer = setTimeout(() => {
          setDisplayText(current.slice(0, displayText.length + 1));
        }, typingSpeed);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, pauseDuration);
      }
    } else {
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(current.slice(0, displayText.length - 1));
        }, deletingSpeed);
      } else {
        setIsDeleting(false);
        setSuggestionIdx((prev) => (prev + 1) % suggestions.length);
        timer = setTimeout(() => {}, 350);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, suggestionIdx, suggestions, typingSpeed, deletingSpeed, pauseDuration]);

  return displayText;
}
