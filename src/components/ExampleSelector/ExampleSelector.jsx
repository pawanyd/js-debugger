import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

export default function ExampleSelector({ examples = [], onSelect, currentId }) {
  // Group examples by category
  const grouped = examples.reduce((acc, example) => {
    const category = example.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(example);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  return (
    <div className="relative inline-flex items-center gap-2">
      <BookOpen className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
      <div className="relative">
        <select
          value={currentId || ''}
          onChange={(e) => {
            const selected = examples.find((ex) => ex.id === e.target.value);
            if (selected && onSelect) onSelect(selected);
          }}
          className="appearance-none bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 pr-8 text-sm text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors cursor-pointer min-w-[180px]"
        >
          {!currentId && (
            <option value="" disabled>
              Choose an example...
            </option>
          )}
          {categories.length > 0 ? (
            categories.map((category) => (
              <optgroup key={category} label={category}>
                {grouped[category].map((example) => (
                  <option key={example.id} value={example.id}>
                    {example.title}
                  </option>
                ))}
              </optgroup>
            ))
          ) : (
            examples.map((example) => (
              <option key={example.id} value={example.id}>
                {example.title}
              </option>
            ))
          )}
        </select>

        {/* Custom dropdown arrow */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
