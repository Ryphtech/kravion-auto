'use client';

import React, {
  Children,
  Fragment,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  ReactNode,
  CSSProperties,
} from 'react';
import './ScrollStack.css';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const resolveOffset = (value: number | string, size: number) => {
  if (typeof value === 'number') return value;
  const text = String(value).trim();
  if (text.endsWith('%')) return (parseFloat(text) / 100) * size;
  return parseFloat(text) || 0;
};

const toLength = (value: number | string) =>
  typeof value === 'number' ? `${value}px` : value;

const scrollsInside = (
  node: HTMLElement | null,
  stop: HTMLElement | null,
  delta: number
) => {
  for (
    let element: HTMLElement | null = node;
    element && element !== stop;
    element = element.parentElement
  ) {
    if (element.scrollHeight <= element.clientHeight + 1) continue;
    const overflow = getComputedStyle(element).overflowY;
    if (overflow !== 'auto' && overflow !== 'scroll') continue;
    if (
      delta > 0
        ? element.scrollTop + element.clientHeight < element.scrollHeight - 1
        : element.scrollTop > 0
    ) {
      return true;
    }
  }
  return false;
};

export interface ScrollStackItemProps {
  children: ReactNode;
  itemClassName?: string;
  style?: CSSProperties;
}

export const ScrollStackItem: React.FC<ScrollStackItemProps> = ({
  children,
  itemClassName = '',
  style,
}) => (
  <div className={`scroll-stack-card ${itemClassName}`.trim()} style={style}>
    {children}
    <span className="scroll-stack-card__shade" aria-hidden="true" />
  </div>
);

export interface ScrollStackProps {
  children: ReactNode;
  className?: string;
  itemDistance?: number;
  itemStackDistance?: number;
  stackPosition?: number | string;
  itemScale?: number;
  baseScale?: number;
  dimAmount?: number;
  blurAmount?: number;
  tiltAmount?: number;
  rotationAmount?: number;
  holdDistance?: number;
  smoothScroll?: boolean;
  snap?: boolean;
  useWindowScroll?: boolean;
  onStackComplete?: () => void;
}

const ScrollStack: React.FC<ScrollStackProps> = ({
  children,
  className = '',
  itemDistance = 100,
  itemStackDistance = 24,
  stackPosition = '15%',
  itemScale = 0.05,
  baseScale = 0.8,
  dimAmount = 0.2,
  blurAmount = 0,
  tiltAmount = 0,
  rotationAmount = 0,
  holdDistance = 200,
  smoothScroll = true,
  snap = false,
  useWindowScroll = false,
  onStackComplete,
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const settingsRef = useRef<any>(null);
  const scheduleRef = useRef<(() => void) | null>(null);
  const items = Children.toArray(children);

  useIsomorphicLayoutEffect(() => {
    settingsRef.current = {
      itemDistance,
      itemStackDistance,
      stackPosition,
      itemScale,
      baseScale,
      dimAmount,
      blurAmount,
      tiltAmount,
      rotationAmount,
      holdDistance,
      smoothScroll,
      snap,
      onStackComplete,
    };
    scheduleRef.current?.();
  });

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const inner = innerRef.current;
    const end = endRef.current;
    if (!root || !inner || !end) return undefined;

    const windowed = useWindowScroll;
    const target: Window | HTMLDivElement = windowed ? window : root;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const cache = new Map<string, any>();
    let frame = 0;
    let glide = 0;
    let rest = 0;
    let complete = false;
    let gliding = false;
    let pressed = false;
    let current = 0;
    let goal = 0;
    let written = 0;
    let last = 0;
    let points: number[] = [];
    let reach = 0;

    const readScroll = () => (windowed ? window.scrollY : root.scrollTop);
    const maxScroll = () =>
      windowed
        ? document.documentElement.scrollHeight - window.innerHeight
        : root.scrollHeight - root.clientHeight;
    const writeScroll = (value: number) => {
      written = value;
      target.scrollTo({ top: value, behavior: 'instant' as ScrollBehavior });
    };

    const write = (key: string, value: any, apply: (val: any) => void) => {
      if (cache.get(key) === value) return false;
      cache.set(key, value);
      apply(value);
      return true;
    };

    let cachedHeights: number[] = [];
    let cachedStackTop = 0;
    let cachedOffset = 0;
    let cachedPadTop = 0;
    let cachedEndHeight = 0;
    let layoutDone = false;

    const computeLayout = () => {
      const settings = settingsRef.current;
      const slots = Array.from(inner.children).filter((child) =>
        child.hasAttribute('data-stack-slot')
      ) as HTMLElement[];
      if (!settings || !slots.length) return;

      const viewHeight = windowed ? window.innerHeight : root.clientHeight;
      const viewTop = windowed
        ? 0
        : root.getBoundingClientRect().top + root.clientTop;
      cachedStackTop = resolveOffset(settings.stackPosition, viewHeight);
      cachedOffset = settings.itemStackDistance;
      cachedHeights = slots.map((slot) => slot.offsetHeight);
      const lastPin = cachedStackTop + (slots.length - 1) * cachedOffset;
      cachedPadTop = windowed ? 0 : cachedStackTop;
      cachedEndHeight =
        settings.holdDistance +
        (windowed
          ? 0
          : Math.max(
              0,
              viewHeight -
                lastPin -
                (cachedHeights[cachedHeights.length - 1] || 0)
            ));

      inner.style.paddingTop = `${cachedPadTop}px`;
      end.style.height = `${cachedEndHeight}px`;

      let flow =
        inner.getBoundingClientRect().top -
        viewTop +
        readScroll() +
        cachedPadTop;
      points = cachedHeights.map((height, i) => {
        const point = flow - cachedStackTop - i * cachedOffset;
        flow += height + settings.itemDistance;
        return point;
      });
      reach = Math.max(
        40,
        ((cachedHeights[0] || 0) + settings.itemDistance - cachedOffset) / 2
      );
      layoutDone = true;
    };

    const update = () => {
      frame = 0;
      const settings = settingsRef.current;
      const slots = Array.from(inner.children).filter((child) =>
        child.hasAttribute('data-stack-slot')
      ) as HTMLElement[];
      if (!settings || !slots.length) return;

      if (!layoutDone) computeLayout();

      const viewHeight = windowed ? window.innerHeight : root.clientHeight;
      const viewTop = windowed
        ? 0
        : root.getBoundingClientRect().top + root.clientTop;
      const stackTop = cachedStackTop || resolveOffset(settings.stackPosition, viewHeight);
      const offset = cachedOffset || settings.itemStackDistance;
      const heights = cachedHeights.length ? cachedHeights : slots.map((slot) => slot.offsetHeight);
      const tops = slots.map((slot) => slot.getBoundingClientRect().top);

      const depths = slots.map(() => 0);
      let lastCover = 0;
      for (let j = 1; j < slots.length; j++) {
        const pinBefore = viewTop + stackTop + (j - 1) * offset;
        const start = pinBefore + (heights[j - 1] || 0);
        const span = Math.max(1, start - pinBefore - offset);
        const cover = Math.min(1, Math.max(0, (start - tops[j]) / span));
        for (let i = 0; i < j; i++) depths[i] += cover;
        lastCover = cover;
      }

      const dimStep = Math.min(Math.max(settings.dimAmount, 0), 1);
      slots.forEach((slot, i) => {
        const card = slot.firstElementChild as HTMLElement | null;
        if (!card) return;
        const depth = depths[i];
        const lean = Math.min(depth, 1);
        const scale = Math.max(
          Math.min(settings.baseScale, 1),
          1 - depth * settings.itemScale
        );
        const tilt = -lean * settings.tiltAmount;
        const turn = lean * settings.rotationAmount * (i % 2 ? -1 : 1);
        const blur = depth * settings.blurAmount;
        const dim = 1 - Math.pow(1 - dimStep, depth);

        const transform =
          depth < 0.0005
            ? ''
            : settings.tiltAmount > 0 || settings.rotationAmount > 0
            ? `perspective(1200px) rotateX(${tilt.toFixed(2)}deg) rotate(${turn.toFixed(2)}deg) scale(${scale.toFixed(4)})`
            : `translateZ(0) scale(${scale.toFixed(4)})`;

        write(`transform${i}`, transform, (value: string) => {
          card.style.transform = value;
        });

        if (settings.blurAmount > 0) {
          write(`filter${i}`, blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : '', (value: string) => {
            card.style.filter = value;
          });
        }

        write(`dim${i}`, dim.toFixed(3), (value: string) => {
          card.style.setProperty('--scroll-stack-dim', value);
        });
      });

      const done = slots.length > 1 && lastCover >= 0.999;
      if (done !== complete) {
        complete = done;
        if (done) settings.onStackComplete?.();
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (Math.abs(readScroll() - written) > 2) {
        gliding = false;
        glide = 0;
        settleSoon();
        return;
      }
      current += (goal - current) * (1 - Math.pow(0.9, dt * 60));
      if (Math.abs(goal - current) < 0.5) current = goal;
      writeScroll(current);
      if (current === goal) {
        gliding = false;
        glide = 0;
        settleSoon();
        return;
      }
      glide = requestAnimationFrame(step);
    };

    const glideTo = (value: number) => {
      goal = Math.min(Math.max(value, 0), maxScroll());
      if (motion.matches) {
        writeScroll(goal);
        return;
      }
      if (gliding) return;
      gliding = true;
      current = readScroll();
      written = current;
      last = performance.now();
      glide = requestAnimationFrame(step);
    };

    const settle = () => {
      rest = 0;
      if (!settingsRef.current?.snap || gliding || pressed || !points.length)
        return;
      const now = readScroll();
      const nearest = points.reduce((best, point) =>
        Math.abs(point - now) < Math.abs(best - now) ? point : best
      );
      const gap = Math.abs(nearest - now);
      if (gap > 1 && gap < reach) glideTo(nearest);
    };

    const settleSoon = () => {
      window.clearTimeout(rest);
      rest = window.setTimeout(settle, 140);
    };

    const onScroll = () => {
      schedule();
      if (!gliding && settingsRef.current?.snap) settleSoon();
    };

    const onWheel = (event: WheelEvent) => {
      const settings = settingsRef.current;
      if (!settings?.smoothScroll) {
        // Native wheel handling: no lag, off-thread scrolling
        if (!windowed && root) {
          const delta = event.deltaY;
          const current = root.scrollTop;
          const max = maxScroll();
          if (delta > 0 && current >= max - 1) {
            window.scrollBy({ top: delta, behavior: 'auto' });
          } else if (delta < 0 && current <= 1) {
            window.scrollBy({ top: delta, behavior: 'auto' });
          }
        }
        return;
      }

      if (motion.matches || event.defaultPrevented || event.ctrlKey) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const page = windowed ? window.innerHeight : root.clientHeight;
      const delta =
        event.deltaY *
        (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? page : 1);
      if (
        !delta ||
        scrollsInside(event.target as HTMLElement, windowed ? document.body : root, delta)
      )
        return;

      const base = gliding ? goal : readScroll();
      const max = maxScroll();

      if (delta > 0 && base >= max - 1) {
        if (!windowed) window.scrollBy({ top: delta, behavior: 'auto' });
        return;
      }

      if (delta < 0 && base <= 1) {
        if (!windowed) window.scrollBy({ top: delta, behavior: 'auto' });
        return;
      }

      if (delta > 0 && base + delta > max) {
        const overflow = base + delta - max;
        event.preventDefault();
        window.clearTimeout(rest);
        glideTo(max);
        if (!windowed && overflow > 0) window.scrollBy({ top: overflow, behavior: 'auto' });
        return;
      }

      if (delta < 0 && base + delta < 0) {
        const underflow = base + delta;
        event.preventDefault();
        window.clearTimeout(rest);
        glideTo(0);
        if (!windowed && underflow < 0) window.scrollBy({ top: underflow, behavior: 'auto' });
        return;
      }

      event.preventDefault();
      window.clearTimeout(rest);
      glideTo(base + delta);
    };

    const onPress = () => {
      pressed = true;
      window.clearTimeout(rest);
    };

    const onRelease = () => {
      if (!pressed) return;
      pressed = false;
      if (settingsRef.current?.snap) settleSoon();
    };

    const observer = new ResizeObserver(() => {
      computeLayout();
      schedule();
    });
    observer.observe(root);
    target.addEventListener('scroll', onScroll, { passive: true });
    target.addEventListener('wheel', onWheel as any, { passive: true });
    target.addEventListener('pointerdown', onPress, { passive: true });
    window.addEventListener('pointerup', onRelease, { passive: true });
    window.addEventListener('pointercancel', onRelease, { passive: true });
    window.addEventListener('resize', () => {
      computeLayout();
      schedule();
    });
    scheduleRef.current = schedule;
    computeLayout();
    update();

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(glide);
      window.clearTimeout(rest);
      observer.disconnect();
      target.removeEventListener('scroll', onScroll);
      target.removeEventListener('wheel', onWheel as any);
      target.removeEventListener('pointerdown', onPress);
      window.removeEventListener('pointerup', onRelease);
      window.removeEventListener('pointercancel', onRelease);
      scheduleRef.current = null;
    };
  }, [useWindowScroll]);

  return (
    <div
      ref={rootRef}
      className={`scroll-stack ${useWindowScroll ? 'scroll-stack--window' : 'scroll-stack--contained'} ${className}`.trim()}
    >
      <div ref={innerRef} className="scroll-stack__inner">
        {items.map((child, index) => {
          const gap = itemDistance - (items.length - index) * itemStackDistance;
          return (
            <Fragment
              key={isValidElement(child) ? (child.key ?? index) : index}
            >
              {index > 0 && (
                <div
                  aria-hidden="true"
                  style={{
                    height: Math.max(0, gap),
                    marginTop: Math.min(0, gap),
                  }}
                />
              )}
              <div
                data-stack-slot=""
                className="scroll-stack__slot"
                style={{
                  top: `calc(${toLength(stackPosition)} + ${index * itemStackDistance}px)`,
                  marginBottom: (items.length - 1 - index) * itemStackDistance,
                  zIndex: index + 1,
                }}
              >
                {child}
              </div>
            </Fragment>
          );
        })}
        <div ref={endRef} className="scroll-stack__end" aria-hidden="true" />
      </div>
    </div>
  );
};

export default ScrollStack;
