import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Difficulty, RouteCategory } from '../../types/api';

/**
 * Hand-drawn, multi-layer filter icons with a per-icon tap animation.
 *
 * The font-glyph icons (MaterialCommunityIcons) are single shapes, so their
 * parts can't move independently — these redraw each pictogram as separate
 * SVG layers (each sword its own layer, each temple column its own layer…)
 * so a tap can play a little scene that matches the picture:
 *
 *  - HISTORICAL      temple columns re-erect themselves one by one
 *  - BATTLE          the two swords swing apart and clash back into a cross
 *  - SCENIC          the sun rises from behind the ridge
 *  - GATHERING_SPOT  the side figures huddle in toward the middle one
 *  - MIXED           the two signpost boards seesaw as if knocked by wind
 *  - difficulty      a gauge whose needle kicks harder the harder the grade
 *
 * Parents trigger the animation imperatively via ref.play() on press —
 * no state changes, so nothing re-renders mid-animation (important: these
 * live above Explore's BottomSheetFlatList; see the scroll-freeze history).
 * All animations drive only transform/opacity with the native driver.
 */

export interface FilterIconHandle {
  play: () => void;
}

interface IconProps {
  size: number;
  color: string;
}

const VB = 24; // shared viewBox side

/** Absolute-fill SVG layer inside the icon's square. */
function Layer({
  size,
  children,
}: {
  size: number;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${VB} ${VB}`}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      {children}
    </Svg>
  );
}

const AnimatedView = Animated.View;

// ---------------------------------------------------------------------------
// HISTORICAL — temple; columns rebuild bottom-up, staggered left to right.
// ---------------------------------------------------------------------------

const HistoricalIcon = forwardRef<FilterIconHandle, IconProps>(
  ({ size, color }, ref) => {
    const cols = [
      useRef(new Animated.Value(0)).current,
      useRef(new Animated.Value(0)).current,
      useRef(new Animated.Value(0)).current,
    ];

    useImperativeHandle(ref, () => ({
      play: () => {
        cols.forEach((v) => v.setValue(1));
        Animated.stagger(
          70,
          cols.map((v) =>
            Animated.spring(v, {
              toValue: 0,
              friction: 5,
              tension: 120,
              useNativeDriver: true,
            }),
          ),
        ).start();
      },
    }));

    const columnX = [5.4, 11, 16.6];
    return (
      <View style={{ width: size, height: size }}>
        {/* Pediment + base (static) */}
        <Layer size={size}>
          <Path d="M12 2.5 L21.5 8 H2.5 Z" fill={color} />
          <Path d="M3 19.5 H21 V21.5 H3 Z" fill={color} />
        </Layer>
        {/* Columns (each its own layer so they can stagger) */}
        {cols.map((v, i) => (
          <AnimatedView
            key={i}
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.2] }),
                transform: [
                  {
                    translateY: v.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, size * 0.22],
                    }),
                  },
                ],
              },
            ]}
          >
            <Layer size={size}>
              <Path d={`M${columnX[i]} 10 h2 v8 h-2 Z`} fill={color} />
            </Layer>
          </AnimatedView>
        ))}
      </View>
    );
  },
);
HistoricalIcon.displayName = 'HistoricalIcon';

// ---------------------------------------------------------------------------
// BATTLE — two separate swords; they swing apart, clash back into the cross,
// and the whole icon gives a short impact pulse on contact.
// ---------------------------------------------------------------------------

const BattleIcon = forwardRef<FilterIconHandle, IconProps>(
  ({ size, color }, ref) => {
    const swing = useRef(new Animated.Value(0)).current;
    const pulse = useRef(new Animated.Value(0)).current;

    useImperativeHandle(ref, () => ({
      play: () => {
        pulse.setValue(0);
        Animated.sequence([
          // wind up: blades swing apart…
          Animated.timing(swing, {
            toValue: 1,
            duration: 130,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          // …and clash back together with overshoot
          Animated.parallel([
            Animated.spring(swing, {
              toValue: 0,
              friction: 4,
              tension: 160,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.delay(60),
              Animated.timing(pulse, {
                toValue: 1,
                duration: 90,
                useNativeDriver: true,
              }),
              Animated.timing(pulse, {
                toValue: 0,
                duration: 140,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]).start();
      },
    }));

    const leftRotate = swing.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '-32deg'],
    });
    const rightRotate = swing.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '32deg'],
    });
    const impactScale = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.18],
    });

    return (
      <AnimatedView
        style={{ width: size, height: size, transform: [{ scale: impactScale }] }}
      >
        {/* Sword pointing up-right */}
        <AnimatedView
          style={[StyleSheet.absoluteFill, { transform: [{ rotate: leftRotate }] }]}
        >
          <Layer size={size}>
            <Path
              d="M6.5 17.5 L17 7 M7.7 14.1 L9.9 16.3"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Layer>
        </AnimatedView>
        {/* Sword pointing up-left */}
        <AnimatedView
          style={[StyleSheet.absoluteFill, { transform: [{ rotate: rightRotate }] }]}
        >
          <Layer size={size}>
            <Path
              d="M17.5 17.5 L7 7 M16.3 14.1 L14.1 16.3"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Layer>
        </AnimatedView>
      </AnimatedView>
    );
  },
);
BattleIcon.displayName = 'BattleIcon';

// ---------------------------------------------------------------------------
// SCENIC — ridge with a sun that rises from behind it (sun layer is under
// the mountains, so it genuinely emerges from behind the peaks).
// ---------------------------------------------------------------------------

const ScenicIcon = forwardRef<FilterIconHandle, IconProps>(
  ({ size, color }, ref) => {
    const rise = useRef(new Animated.Value(0)).current;

    useImperativeHandle(ref, () => ({
      play: () => {
        rise.setValue(1);
        Animated.timing(rise, {
          toValue: 0,
          duration: 550,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      },
    }));

    return (
      <View style={{ width: size, height: size }}>
        <AnimatedView
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: rise.interpolate({ inputRange: [0, 1], outputRange: [1, 0.25] }),
              transform: [
                {
                  translateY: rise.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, size * 0.3],
                  }),
                },
              ],
            },
          ]}
        >
          <Layer size={size}>
            <Circle cx={18.5} cy={6} r={2.4} fill={color} />
          </Layer>
        </AnimatedView>
        {/* Ridge (static, drawn over the sun) */}
        <Layer size={size}>
          <Path d="M1.5 19.5 L8.5 9 L12.5 14.5 L16 9.5 L22.5 19.5 Z" fill={color} />
        </Layer>
      </View>
    );
  },
);
ScenicIcon.displayName = 'ScenicIcon';

// ---------------------------------------------------------------------------
// GATHERING_SPOT — three figures; the outer two huddle in toward the middle.
// ---------------------------------------------------------------------------

/** Stroked stick-figure bust: head circle + shoulder arc. */
function Person({
  cx,
  headY,
  headR,
  color,
}: {
  cx: number;
  headY: number;
  headR: number;
  color: string;
}): React.ReactElement {
  const w = headR * 2.4;
  const shoulderY = headY + headR * 3.4;
  return (
    <>
      <Circle cx={cx} cy={headY} r={headR} stroke={color} strokeWidth={1.8} fill="none" />
      <Path
        d={`M${cx - w} ${shoulderY} q${w} -${headR * 2.6} ${w * 2} 0`}
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
    </>
  );
}

const GatheringIcon = forwardRef<FilterIconHandle, IconProps>(
  ({ size, color }, ref) => {
    const huddle = useRef(new Animated.Value(0)).current;

    useImperativeHandle(ref, () => ({
      play: () => {
        Animated.sequence([
          Animated.timing(huddle, {
            toValue: 1,
            duration: 150,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(huddle, {
            toValue: 0,
            friction: 4,
            tension: 100,
            useNativeDriver: true,
          }),
        ]).start();
      },
    }));

    const inLeft = huddle.interpolate({
      inputRange: [0, 1],
      outputRange: [0, size * 0.09],
    });
    const inRight = huddle.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -size * 0.09],
    });

    return (
      <View style={{ width: size, height: size }}>
        <AnimatedView
          style={[StyleSheet.absoluteFill, { transform: [{ translateX: inLeft }] }]}
        >
          <Layer size={size}>
            <Person cx={5.4} headY={9.6} headR={2} color={color} />
          </Layer>
        </AnimatedView>
        <AnimatedView
          style={[StyleSheet.absoluteFill, { transform: [{ translateX: inRight }] }]}
        >
          <Layer size={size}>
            <Person cx={18.6} headY={9.6} headR={2} color={color} />
          </Layer>
        </AnimatedView>
        {/* Middle figure on top so the huddle tucks behind it */}
        <Layer size={size}>
          <Person cx={12} headY={7.6} headR={2.5} color={color} />
        </Layer>
      </View>
    );
  },
);
GatheringIcon.displayName = 'GatheringIcon';

// ---------------------------------------------------------------------------
// MIXED — trail signpost with two boards pointing opposite ways; a tap knocks
// them into a seesaw wobble (boards swing in antiphase and spring back).
// The post runs through x=12, the horizontal centre of the viewBox, so
// rotating each board layer around the view centre reads as pivoting on
// the post.
// ---------------------------------------------------------------------------

const MixedIcon = forwardRef<FilterIconHandle, IconProps>(
  ({ size, color }, ref) => {
    const wobble = useRef(new Animated.Value(0)).current;

    useImperativeHandle(ref, () => ({
      play: () => {
        Animated.sequence([
          Animated.timing(wobble, {
            toValue: 1,
            duration: 120,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(wobble, {
            toValue: 0,
            friction: 3,
            tension: 90,
            useNativeDriver: true,
          }),
        ]).start();
      },
    }));

    const topSwing = wobble.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '9deg'],
    });
    const bottomSwing = wobble.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '-9deg'],
    });

    return (
      <View style={{ width: size, height: size }}>
        {/* Post + finial knob (static) */}
        <Layer size={size}>
          <Path
            d="M12 4.5 V21"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Circle cx={12} cy={3.4} r={1.1} fill={color} />
        </Layer>
        {/* Upper board, pointing right */}
        <AnimatedView
          style={[StyleSheet.absoluteFill, { transform: [{ rotate: topSwing }] }]}
        >
          <Layer size={size}>
            <Path d="M8 6.2 H16.8 L19.2 8 L16.8 9.8 H8 Z" fill={color} />
          </Layer>
        </AnimatedView>
        {/* Lower board, pointing left */}
        <AnimatedView
          style={[StyleSheet.absoluteFill, { transform: [{ rotate: bottomSwing }] }]}
        >
          <Layer size={size}>
            <Path d="M16 12.2 H7.2 L4.8 14 L7.2 15.8 H16 Z" fill={color} />
          </Layer>
        </AnimatedView>
      </View>
    );
  },
);
MixedIcon.displayName = 'MixedIcon';

// ---------------------------------------------------------------------------
// Difficulty — one gauge, three temperaments. The needle rests at
// low/mid/high, and a tap kicks it with force matching the grade: EASY gives
// a lazy wobble, HARD winds up and slams to the stop with overshoot.
// ---------------------------------------------------------------------------

const GAUGE_REST_DEG: Record<Difficulty, number> = {
  EASY: -40,
  MODERATE: 0,
  HARD: 40,
};

const GAUGE_KICK: Record<Difficulty, { windup: number; kick: number }> = {
  EASY: { windup: -8, kick: 10 },
  MODERATE: { windup: -14, kick: 18 },
  HARD: { windup: -24, kick: 28 },
};

export const GaugeIcon = forwardRef<
  FilterIconHandle,
  IconProps & { difficulty: Difficulty }
>(({ size, color, difficulty }, ref) => {
  const delta = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    play: () => {
      const { windup, kick } = GAUGE_KICK[difficulty];
      Animated.sequence([
        Animated.timing(delta, {
          toValue: windup,
          duration: 110,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(delta, {
          toValue: kick,
          duration: 140,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(delta, {
          toValue: 0,
          friction: 4,
          tension: 110,
          useNativeDriver: true,
        }),
      ]).start();
    },
  }));

  const rest = GAUGE_REST_DEG[difficulty];
  const rotate = delta.interpolate({
    inputRange: [-90, 90],
    outputRange: [`${rest - 90}deg`, `${rest + 90}deg`],
  });

  return (
    <View style={{ width: size, height: size }}>
      {/* Dial arc + hub (static). Hub sits at (12, 12) — the exact centre of
          the 24x24 viewBox — because RN rotates a transformed View around
          its own centre. Any hub position off-centre (the original had it
          at y=17) rotates around the wrong point and the needle swings
          through a lopsided, glitchy arc instead of pivoting in place. */}
      <Layer size={size}>
        <Path
          d="M4.5 12 A 7.5 7.5 0 0 1 19.5 12"
          stroke={color}
          strokeWidth={1.6}
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx={12} cy={12} r={1.6} fill={color} />
      </Layer>
      <AnimatedView
        style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}
      >
        <Layer size={size}>
          <Path
            d="M12 12 L12 7"
            stroke={color}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </Layer>
      </AnimatedView>
    </View>
  );
});
GaugeIcon.displayName = 'GaugeIcon';

// ---------------------------------------------------------------------------

const CATEGORY_ICON: Record<
  RouteCategory,
  React.ForwardRefExoticComponent<IconProps & React.RefAttributes<FilterIconHandle>>
> = {
  HISTORICAL: HistoricalIcon,
  BATTLE: BattleIcon,
  SCENIC: ScenicIcon,
  GATHERING_SPOT: GatheringIcon,
  MIXED: MixedIcon,
};

export const CategoryIcon = forwardRef<
  FilterIconHandle,
  IconProps & { category: RouteCategory }
>(({ category, ...rest }, ref) => {
  const Component = CATEGORY_ICON[category];
  return <Component ref={ref} {...rest} />;
});
CategoryIcon.displayName = 'CategoryIcon';
