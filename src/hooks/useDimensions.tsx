import { RefObject, useCallback, useEffect, useState } from 'react';

export const useDimensions = (targetRef: RefObject<HTMLElement | SVGSVGElement | null>) => {
  const getDimensions = useCallback(() => {
    const element = targetRef.current;
    if (!element) {
      return {
        width: 0,
        height: 0,
      };
    }

    if (element instanceof SVGSVGElement) {
      return {
        width: element.clientWidth,
        height: element.clientHeight,
      };
    }

    return {
      width: element.offsetWidth,
      height: element.offsetHeight,
    };
  }, [targetRef]);

  const [dimensions, setDimensions] = useState(getDimensions);

  const handleResize = useCallback(() => {
    setDimensions(getDimensions());
  }, [getDimensions]);

  useEffect(() => {
    const element = targetRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver(handleResize);
    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [targetRef, handleResize]);

  return { dimensions, handleResize };
};
