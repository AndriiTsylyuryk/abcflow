import { Info } from "lucide-react";

interface TooltipProps {
  text: string;
}

export function InfoTooltip({ text }: TooltipProps) {
  return (
    <span className="relative group inline-flex items-center">
      <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-lg bg-gray-800 text-white text-xs px-3 py-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 text-center leading-relaxed shadow-lg">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
      </span>
    </span>
  );
}
