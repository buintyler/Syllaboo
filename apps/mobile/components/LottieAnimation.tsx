import { useRef, useEffect, useState } from 'react';
import { AccessibilityInfo, View, type ViewStyle, type StyleProp } from 'react-native';
import LottieView from 'lottie-react-native';

interface LottieAnimationProps {
  source: ReturnType<typeof require>;
  style?: StyleProp<ViewStyle>;
  autoPlay?: boolean;
  loop?: boolean;
  speed?: number;
}

/**
 * Wrapper around LottieView that respects reduce-motion accessibility setting.
 * When reduce-motion is enabled, shows the first frame as a static image.
 */
export default function LottieAnimation({
  source,
  style,
  autoPlay = true,
  loop = false,
  speed = 1,
}: LottieAnimationProps) {
  const lottieRef = useRef<LottieView>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  // When reduce-motion is on, show the last frame as a static image
  useEffect(() => {
    if (reduceMotion && lottieRef.current) {
      lottieRef.current.reset();
    }
  }, [reduceMotion]);

  if (reduceMotion) {
    // Render nothing for motion-heavy decorative animations
    return <View style={style} />;
  }

  return (
    <LottieView
      ref={lottieRef}
      source={source}
      style={style}
      autoPlay={autoPlay}
      loop={loop}
      speed={speed}
      resizeMode="contain"
    />
  );
}
