import { useEffect, useRef, useState, type ReactNode } from 'react';

type Props = {
  title: string;
  /** Large iOS-style title in the content that collapses into the bar on scroll. */
  large?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Extra row pinned under the bar (e.g. a section switcher). */
  below?: ReactNode;
};

export function Page({ title, large, left, right, children, className, below }: Props) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(!large);

  useEffect(() => {
    if (!large || !sentinel.current) return;
    const io = new IntersectionObserver(([e]) => setCollapsed(!e.isIntersecting), {
      rootMargin: '-56px 0px 0px 0px',
    });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [large]);

  return (
    <div className={'page' + (className ? ' ' + className : '')}>
      <header className={'nav' + (collapsed ? ' collapsed' : '')}>
        <div className="nav-row">
          <div className="nav-side">{left}</div>
          <div className="nav-title" aria-hidden={!collapsed}>
            {title}
          </div>
          <div className="nav-side end">{right}</div>
        </div>
        {below}
      </header>
      {large ? (
        <div className="large-title" ref={sentinel}>
          {large}
        </div>
      ) : null}
      <main className="content">{children}</main>
    </div>
  );
}
