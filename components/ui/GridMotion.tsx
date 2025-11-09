import { useEffect, useRef, FC, ReactNode } from "react";
import { gsap } from "gsap";

interface GridMotionProps {
  items?: (string | ReactNode)[];
  gradientColor?: string;
}

const GridMotion: FC<GridMotionProps> = ({
  items = [],
  gradientColor = "black",
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  const totalItems = 28;
  const defaultItems = Array.from(
    { length: totalItems },
    (_, index) => `Item ${index + 1}`
  );
  const combinedItems =
    items.length > 0 ? items.slice(0, totalItems) : defaultItems;

  useEffect(() => {
    gsap.ticker.lagSmoothing(0);

    // Auto-scroll animation for each row
    const animations = rowRefs.current.map((row, index) => {
      if (row) {
        const direction = index % 2 === 0 ? 1 : -1;
        const scrollDistance = 200;
        const duration = 20 + index * 2; // Different speeds for each row

        return gsap.to(row, {
          x: direction * scrollDistance,
          duration: duration,
          ease: "none",
          repeat: -1,
          yoyo: true,
        });
      }
      return null;
    });

    return () => {
      animations.forEach((anim) => {
        if (anim) anim.kill();
      });
    };
  }, []);

  return (
    <div ref={gridRef} className="h-full w-full overflow-hidden">
      <section
        className="w-full h-screen overflow-hidden relative flex items-center justify-center"
        style={{
          background: `radial-gradient(circle, ${gradientColor} 0%, transparent 100%)`,
        }}
      >
        <div className="absolute inset-0 pointer-events-none z-[4] bg-[length:250px]"></div>
        <div className="gap-2 sm:gap-4 flex-none relative w-[200vw] sm:w-[150vw] h-[200vh] sm:h-[150vh] grid grid-rows-4 grid-cols-1 rotate-[-15deg] sm:rotate-[-15deg] origin-center z-2">
          {Array.from({ length: 4 }, (_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid gap-2 sm:gap-4 grid-cols-4 sm:grid-cols-7"
              style={{ willChange: "transform" }}
              ref={(el) => {
                if (el) rowRefs.current[rowIndex] = el;
              }}
            >
              {Array.from({ length: 7 }, (_, itemIndex) => {
                const content = combinedItems[rowIndex * 7 + itemIndex];
                return (
                  <div key={itemIndex} className="relative aspect-square">
                    <div className="relative w-full h-full overflow-hidden rounded-lg sm:rounded-[10px] bg-[#111] flex items-center justify-center text-white text-xs sm:text-[1.5rem]">
                      {typeof content === "string" &&
                      content.startsWith("http") ? (
                        <div
                          className="w-full h-full bg-cover bg-center absolute top-0 left-0"
                          style={{ backgroundImage: `url(${content})` }}
                        ></div>
                      ) : (
                        <div className="p-2 sm:p-4 text-center z-1">{content}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="relative w-full h-full top-0 left-0 pointer-events-none"></div>
      </section>
    </div>
  );
};

export default GridMotion;
