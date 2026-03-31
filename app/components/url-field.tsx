import { useState } from "react";

interface UrlFieldProps {
  name: string;
  defaultValue?: string;
}

function extractUrl(value: string): string {
  if (!value) return "";

  if (value.includes("<a")) {
    const match = value.match(/href="([^"]+)"/);
    return match ? match[1] : "";
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return "";
}

export function UrlField({ name, defaultValue = "" }: UrlFieldProps) {
  const [url, setUrl] = useState(() => extractUrl(defaultValue));

  return (
    <div>
      <input
        type="url"
        name={name}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com"
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />
    </div>
  );
}
