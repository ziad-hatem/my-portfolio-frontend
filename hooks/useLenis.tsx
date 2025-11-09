// import "aos/dist/aos.css";
import Lenis from "lenis";
import { useEffect } from "react";

const useLenisScroll = () => {
  useEffect(() => {
    const lenis = new Lenis({
      wheelMultiplier: 1.5, // Increase this for faster scrolling (Default is 1)
      smoothWheel: true, // Enable smooth scrolling for the mouse wheel
      duration: 1, // Lenis controls smoothness, no need for AOS duration
      easing: (t) => 1 - Math.pow(1 - t, 3),
      lerp: 0.08, // Smoother scrolling
    });

    function raf(time: number) {
      lenis.raf(time);
      // AOS.refreshHard(); // 🔥 Ensures AOS elements recalculate properly

      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // useEffect(() => {
  //     AOS.init({
  //         once: true, // Keeps animations replaying when scrolling back
  //     });
  // }, []);
};

export default useLenisScroll;
