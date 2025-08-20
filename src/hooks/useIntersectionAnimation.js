// hooks/useIntersectionAnimation.js
import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const useIntersectionAnimation = (animationStyle = "fadeIn", isLoaded = true) => {
  const elementRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const contextRef = useRef(null);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element || !isLoaded || hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          observer.disconnect();

          // Clean up any existing GSAP context to prevent conflicts
          if (contextRef.current) {
            contextRef.current.revert();
          }

          // Create fresh GSAP context
          contextRef.current = gsap.context(() => {
            const animatableElements = element.querySelectorAll("[data-animate]");
            if (animatableElements.length === 0) return;

            // Set initial state for all elements
            gsap.set(animatableElements, { opacity: 0, y: 40 });

            // Animation configurations
            const animations = {
              fadeIn: {
                opacity: 1,
                y: 0,
                duration: 1.2,
                stagger: 0.15,
                ease: "power3.out",
              },
              slideLeft: {
                opacity: 1,
                x: 0,
                y: 0,
                duration: 1.2,
                stagger: 0.15,
                ease: "power3.out",
              },
              zoomBounce: {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 1.3,
                stagger: 0.12,
                ease: "back.out(1.7)",
              },
            };

            // Set additional initial properties for specific animations
            if (animationStyle === "slideLeft") {
              gsap.set(animatableElements, { x: -80 });
            } else if (animationStyle === "zoomBounce") {
              gsap.set(animatableElements, { scale: 0.85 });
            }

            // Create ScrollTrigger animation
            gsap.to(animatableElements, {
              scrollTrigger: {
                trigger: element,
                start: "top 85%",
                toggleActions: "play none none none",
                once: true,
              },
              ...animations[animationStyle],
            });

            // Refresh ScrollTrigger after brief delay
            setTimeout(() => ScrollTrigger.refresh(), 100);
          }, element);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px 0px", // Start animations slightly before element is visible
      }
    );

    observer.observe(element);

    // Cleanup function
    return () => {
      observer.disconnect();
      if (contextRef.current) {
        contextRef.current.revert();
      }
    };
  }, [animationStyle, isLoaded, hasAnimated]);

  // Cleanup GSAP context on unmount
  useLayoutEffect(() => {
    return () => {
      if (contextRef.current) {
        contextRef.current.revert();
      }
    };
  }, []);

  return elementRef;
};