import { animate, motion, useInView, useReducedMotion, useMotionValue, useTransform } from "framer-motion";
import { type ReactNode, useEffect, useRef } from "react";

type MotionProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function PageTransition({ children, className }: MotionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Reveal({ children, className, delay = 0 }: MotionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={reduceMotion || inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.45, delay: reduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className, delay = 0 }: MotionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: reduceMotion ? 0 : 0.06,
            delayChildren: reduceMotion ? 0 : delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function MotionCard({ children, className }: MotionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}

type MetricCounterProps = {
  value: string;
  className?: string;
};

export function MetricCounter({ value, className }: MetricCounterProps) {
  const reduceMotion = useReducedMotion();
  const numericValue = Number.parseInt(value.replace(/[^0-9]/g, ""), 10);
  const suffix = value.replace(/[0-9]/g, "");
  const count = useMotionValue(reduceMotion || Number.isNaN(numericValue) ? numericValue || 0 : 0);
  const rounded = useTransform(count, (latest) => `${Math.round(latest)}${suffix}`);

  useEffect(() => {
    if (reduceMotion || Number.isNaN(numericValue)) {
      count.set(numericValue || 0);
      return;
    }

    const controls = animate(count, numericValue, {
      duration: 0.85,
      ease: [0.22, 1, 0.36, 1],
    });

    return () => controls.stop();
  }, [count, numericValue, reduceMotion]);

  if (Number.isNaN(numericValue)) return <span className={className}>{value}</span>;
  return <motion.span className={className}>{rounded}</motion.span>;
}
