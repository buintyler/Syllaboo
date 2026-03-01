import { useRef, useEffect, useState } from 'react';
import { AccessibilityInfo, View, type ViewStyle, type StyleProp } from 'react-native';
import LottieView from 'lottie-react-native';

interface LottieAnimationProps {
  source: ReturnType<typeof require>;
  style?: StyleProp<ViewStyle>;
  autoPlay?: boolean;
  /** false = play once, true = loop forever, number = loop N times */
  loop?: boolean | number;
}

/**
 * Wrapper around LottieView that respects reduce-motion accessibility setting.
 * When reduce-motion is enabled, renders an empty placeholder.
 * Defaults to suppressing animation until the accessibility check resolves
 * to prevent a visible flash on first render.
 */
export default function LottieAnimation({
  source,
  style,
  autoPlay = true,
  loop = false,
}: LottieAnimationProps) {
  const lottieRef = useRef<LottieView>(null);
  const iterationRef = useRef(0);
  const mountedRef = useRef(true);
  const [motionReady, setMotionReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    mountedRef.current = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mountedRef.current) {
          setReduceMotion(enabled);
          setMotionReady(true);
        }
      })
      .catch(() => {
        if (mountedRef.current) {
          setReduceMotion(false);
          setMotionReady(true);
        }
      });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      if (mountedRef.current) {
        setReduceMotion(enabled);
      }
    });
    return () => {
      mountedRef.current = false;
      sub.remove();
    };
  }, []);

  // When reduce-motion is on, show the last frame as a static image
  useEffect(() => {
    if (reduceMotion && lottieRef.current) {
      lottieRef.current.reset();
    }
  }, [reduceMotion]);

  if (!motionReady || reduceMotion) {
    // Show placeholder until we know the motion preference, or if reduce-motion is on
    return <View style={style} />;
  }

  // Numeric loop: play N times using loop={false} + manual replay on finish
  const isCountedLoop = typeof loop === 'number';
  const loopProp = isCountedLoop ? false : loop;

  const handleAnimationFinish = (isCancelled: boolean) => {
    if (isCancelled || !isCountedLoop) return;
    iterationRef.current += 1;
    if (iterationRef.current < (loop as number) && lottieRef.current) {
      lottieRef.current.play();
    }
  };

  return (
    <LottieView
      ref={lottieRef}
      source={source}
      style={style}
      autoPlay={autoPlay}
      loop={loopProp}
      resizeMode="contain"
      onAnimationFinish={handleAnimationFinish}
    />
  );
}
