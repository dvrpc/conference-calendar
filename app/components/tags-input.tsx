import { useState } from "react";

import { AVAILABLE_TAGS } from "~/lib/constants";

interface TagsInputProps {
  name: string;
  defaultValue?: string[];
}

export function TagsInput({ name, defaultValue = [] }: TagsInputProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(defaultValue);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const MAX_TAGS = 4;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = inputValue.trim();
      if (tag && !selectedTags.includes(tag)) {
        if (selectedTags.length >= MAX_TAGS) {
          setError(`Maximum of ${MAX_TAGS} tags allowed`);
          return;
        }
        const newTags = [...selectedTags, tag];
        setSelectedTags(newTags);
        setInputValue("");
        setError(null);
      }
    } else if (e.key === "Backspace" && !inputValue && selectedTags.length > 0) {
      const newTags = selectedTags.slice(0, -1);
      setSelectedTags(newTags);
      setError(null);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter((t) => t !== tagToRemove);
    setSelectedTags(newTags);
  };

  const suggestedTags = AVAILABLE_TAGS.filter(
    (tag) => tag.toLowerCase().includes(inputValue.toLowerCase()) && !selectedTags.includes(tag)
  );

  return (
    <div>
      {error && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-blue-500 bg-blue-50 px-3 py-1 text-sm text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 cursor-pointer text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          list="tags-datalist"
          placeholder={selectedTags.length === 0 ? "Type a tag and press Enter..." : ""}
          className="min-w-[150px] flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <datalist id="tags-datalist">
          {suggestedTags.map((tag) => (
            <option key={tag} value={tag} />
          ))}
        </datalist>
      </div>
      <input type="hidden" name={name} value={selectedTags.join(",")} />
    </div>
  );
}
