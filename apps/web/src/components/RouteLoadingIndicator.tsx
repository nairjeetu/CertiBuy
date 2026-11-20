"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function RouteLoadingIndicator() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);

  useEffect(() => {
    if (pathname !== prevPath) {
      setLoading(false);
      setPrevPath(pathname);
    }
  }, [pathname, prevPath]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const link = (e.target as HTMLElement).closest("a");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href === pathname) return;
      setLoading(true);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  if (!loading) return null;

  return <div className="page-loading-bar" />;
}
