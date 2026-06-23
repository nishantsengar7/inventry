import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { aiAPI } from '../../services/aiAPI';

export default function CategorySuggester({ productName, description, onCategorySelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!productName || productName.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await aiAPI.suggestCategory({ product_name: productName, description });
        setSuggestions(data || []);
      } catch (err) {
        console.error('Failed to get category suggestions', err);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [productName, description]);

  if (!isLoading && suggestions.length === 0) return null;

  return (
    <div className="mt-2 text-sm">
      {isLoading ? (
        <div className="flex items-center text-indigo-400 gap-2">
          <Loader2 size={14} className="animate-spin" />
          <span className="text-xs">AI analyzing...</span>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 items-center">
          <Sparkles size={14} className="text-indigo-500" />
          <span className="text-gray-500 text-xs font-medium">AI Suggestions:</span>
          {suggestions.slice(0, 2).map((s, idx) => (
            <button
              key={s.category_name}
              type="button"
              onClick={() => onCategorySelect(s.category_name)}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-xs font-medium transition-colors border border-indigo-100"
            >
              {idx === 0 ? 'Suggested: ' : 'Or: '}{s.category_name} ({s.confidence}%)
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
