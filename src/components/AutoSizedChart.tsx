import { useEffect, useRef, useState, type ReactNode } from 'react';

type AutoSizedChartProps = {
  height: number;
  children: (size: { width: number; height: number }) => ReactNode;
};

export function AutoSizedChart({ height, children }: AutoSizedChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry && entry.contentRect.width > 0) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height }}>
      {width > 0 ? children({ width, height }) : null}
    </div>
  );
}
