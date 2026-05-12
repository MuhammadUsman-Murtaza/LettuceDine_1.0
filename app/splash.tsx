import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { getSession } from '@/utils/api';
import { Colors } from '@/constants/Colors';

const { height } = Dimensions.get('window');

/**
 * SPLASH / OPENING ANIMATION SCREEN
 *
 * Flow:
 *  Boot (index.tsx) → Splash (this file) → [Login | Customer Home | Vendor Dashboard]
 *
 * The animation plays for ~2.5 s, then session is checked and the user
 * is routed to the correct destination. Login / all other screens untouched.
 */
export default function SplashScreen() {
  const router = useRouter();

  // ─── Animated values ─────────────────────────────────────────
  const rippleScale   = useSharedValue(0);
  const rippleOpacity = useSharedValue(0.7);

  const logoScale   = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const iconScale   = useSharedValue(0);

  const textOpacity    = useSharedValue(0);
  const textTranslateY = useSharedValue(24);

  const tagOpacity    = useSharedValue(0);
  const tagTranslateY = useSharedValue(16);

  const screenOpacity = useSharedValue(1);

  // ─── Navigate after animation ─────────────────────────────────
  const finishSplash = async () => {
    const { role, isAuthenticated } = await getSession();
    if (!isAuthenticated) {
      router.replace('/login');
    } else if (role === 'vendor') {
      router.replace('/(vendor)/dashboard');
    } else {
      router.replace('/(customer)/(tabs)/');
    }
  };

  // ─── Run animation sequence ────────────────────────────────────
  useEffect(() => {
    const easeOut = Easing.out(Easing.cubic);

    // 1. Gold ripple bursts from centre and fades out
    rippleScale.value   = withTiming(4, { duration: 850, easing: easeOut });
    rippleOpacity.value = withTiming(0, { duration: 850, easing: easeOut });

    // 2. Logo badge springs in
    logoScale.value   = withDelay(250, withSpring(1, { damping: 12, stiffness: 160 }));
    logoOpacity.value = withDelay(250, withTiming(1, { duration: 350 }));

    // 3. Emoji inside badge bounces in
    iconScale.value = withDelay(450, withSpring(1, { damping: 8, stiffness: 220 }));

    // 4. Brand name slides up
    textOpacity.value    = withDelay(650, withTiming(1, { duration: 420, easing: easeOut }));
    textTranslateY.value = withDelay(650, withTiming(0, { duration: 420, easing: easeOut }));

    // 5. Tagline fades in
    tagOpacity.value    = withDelay(950, withTiming(1, { duration: 420, easing: easeOut }));
    tagTranslateY.value = withDelay(950, withTiming(0, { duration: 420, easing: easeOut }));

    // 6. Whole screen fades to black → navigate
    screenOpacity.value = withDelay(
      3200,
      withSequence(
        withTiming(0, { duration: 600, easing: Easing.in(Easing.cubic) }),
        // brief hold then trigger navigation
        withTiming(0, { duration: 80 }, (finished) => {
          if (finished) runOnJS(finishSplash)();
        })
      )
    );
  }, []);

  // ─── Animated styles ──────────────────────────────────────────
  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity:   rippleOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity:   logoOpacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity:   textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const tagStyle = useAnimatedStyle(() => ({
    opacity:   tagOpacity.value,
    transform: [{ translateY: tagTranslateY.value }],
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  // ─── Render ───────────────────────────────────────────────────
  return (
    <Animated.View style={[styles.container, screenStyle]}>
      {/* Two-tone background */}
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      {/* Decorative floating orbs */}
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />
      <View style={[styles.orb, styles.orb3]} />

      {/* Gold ripple burst */}
      <Animated.View style={[styles.ripple, rippleStyle]} />

      {/* ── Centre content ── */}
      <View style={styles.centre}>

        {/* Logo badge */}
        <Animated.View style={[styles.badge, logoStyle]}>
          <Animated.Text style={[styles.badgeEmoji, iconStyle]}>🥗</Animated.Text>
        </Animated.View>

        {/* Brand name */}
        <Animated.Text style={[styles.brandName, textStyle]}>
          LettuceDine
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, tagStyle]}>
          Fresh meals, delivered fast 🚀
        </Animated.Text>

      </View>

      {/* Bottom pill indicator */}
      <View style={styles.pillRow}>
        <View style={styles.pillDot} />
        <View style={[styles.pillDot, styles.pillDotActive]} />
        <View style={styles.pillDot} />
      </View>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // Two-tone dark backdrop
  bgTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: height * 0.46,
    backgroundColor: '#161B27',
  },
  bgBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: height * 0.54,
    backgroundColor: '#0B0F19',
  },

  // Floating orbs (decorative)
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 320, height: 320,
    top: -100, left: -100,
    backgroundColor: Colors.greenForest,   // gold
    opacity: 0.05,
  },
  orb2: {
    width: 220, height: 220,
    bottom: 20, right: -70,
    backgroundColor: Colors.greenFresh,    // teal
    opacity: 0.07,
  },
  orb3: {
    width: 120, height: 120,
    top: height * 0.58, left: 30,
    backgroundColor: Colors.greenFresh,
    opacity: 0.04,
  },

  // Gold ripple circle
  ripple: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.greenForest,
    opacity: 0.5,
  },

  // ── Centre ──
  centre: {
    alignItems: 'center',
    gap: 18,
  },

  // Logo badge
  badge: {
    width: 124,
    height: 124,
    borderRadius: 32,
    backgroundColor: Colors.greenForest,   // gold
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    // Glow
    shadowColor: Colors.greenForest,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 32,
    elevation: 24,
  },
  badgeEmoji: {
    fontSize: 58,
  },

  // "LettuceDine"
  brandName: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.6,
    textShadowColor: Colors.greenForest,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },

  // Tagline
  tagline: {
    fontSize: 15,
    color: Colors.grayLight,
    letterSpacing: 0.4,
  },

  // Bottom indicator dots
  pillRow: {
    position: 'absolute',
    bottom: 52,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  pillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#2D3748',
  },
  pillDotActive: {
    width: 24,
    backgroundColor: Colors.greenForest,
  },
});
