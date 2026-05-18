import { useState } from "react";

interface Props {
  logoUrl?: string;
  ticker: string;
  size?: number;
}

export function AssetLogo({ logoUrl, ticker, size = 24 }: Props) {
  const [errored, setErrored] = useState(false);

  if (logoUrl && !errored) {
    return (
      <img
        src={logoUrl}
        alt={ticker}
        width={size}
        height={size}
        className="rounded-sm object-contain flex-shrink-0 bg-white/5"
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <div
      className="rounded-sm bg-secondary flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-muted-foreground uppercase"
      style={{ width: size, height: size }}
    >
      {ticker.slice(0, 2)}
    </div>
  );
}
