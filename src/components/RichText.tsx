import { Fragment } from 'react';

interface Props {
  text: string;
  onTagClick?: (tag: string) => void;
  onMentionClick?: (handle: string) => void;
}

// Splits text into spans, hashtags, mentions, and links — keeps line breaks.
const TOKEN = /(#[\p{L}0-9_]+|@[\p{L}0-9_]+|https?:\/\/[^\s]+)/gu;

export default function RichText({ text, onTagClick, onMentionClick }: Props) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, li) => (
        <Fragment key={li}>
          {renderLine(line, onTagClick, onMentionClick)}
          {li < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </>
  );
}

function renderLine(
  line: string,
  onTagClick?: (t: string) => void,
  onMentionClick?: (h: string) => void
) {
  const parts = line.split(TOKEN).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      return (
        <button
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            onTagClick?.(part.toLowerCase());
          }}
          className="text-primary hover:underline font-semibold"
        >
          {part}
        </button>
      );
    }
    if (part.startsWith('@')) {
      return (
        <button
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            onMentionClick?.(part.toLowerCase());
          }}
          className="text-accent-blue hover:underline font-semibold"
        >
          {part}
        </button>
      );
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-accent-blue underline underline-offset-2 hover:text-primary break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
