import type { PlanDay, Routine, RoutineBlock, PlannedSet, Settings, SetType } from '@/types';


// ── Builders ───────────────────────────────────────────────

let seq = 0;
const nid = (p: string) => `${p}_${(++seq).toString(36)}`;

function sets(spec: Array<[SetType, number, number, number?]>): PlannedSet[] {
  return spec.map(([type, reps, weight, rpe]) => ({ id: nid('ps'), type, reps, weight, rpe }));
}

function straight(n: number, reps: number, weight: number, warmups: Array<[number, number]> = [], rpe?: number): PlannedSet[] {
  return sets([
    ...warmups.map(([r, w]) => ['warmup', r, w] as [SetType, number, number]),
    ...Array.from({ length: n }, () => ['working', reps, weight, rpe] as [SetType, number, number, number?]),
  ]);
}

function block(exerciseId: string, s: PlannedSet[], rest: number, extra: Partial<RoutineBlock> = {}): RoutineBlock {
  return { id: nid('rb'), exerciseId, sets: s, rest, ...extra };
}

// ── Routines ───────────────────────────────────────────────

export const MOCK_ROUTINES: Routine[] = [
  {
    id: 'upper-a',
    name: 'Upper A: Heavy Push & Pull',
    focus: 'Chest · Back · Shoulders · Arms',
    color: 'peach',
    estMinutes: 78,
    warmupNote:
      '5 min easy rowing or brisk incline walk. 15 band pull-aparts, 10 arm circles each way, 10 push-ups. Bench ramp-up: empty bar × 10, 40% × 6, 60% × 4, 80% × 2.',
    nutritionNote:
      'Training day: 2000 kcal, 125 g protein. Banana and curd or whey at about 4:30 pm.',
    blocks: [
      block(
        'bench',
        straight(5, 5, 60, [], 8),
        150,
        {
          targetReps: '4–6',
          note: 'Feet flat, shoulder blades pinched back and down, bar to mid-chest, press up and slightly back. Stop each set with 1 to 2 reps left (RIR 1–2). Always use a spotter or safety pins.',
        }
      ),
      block(
        'row',
        straight(4, 7, 50, [], 8),
        120,
        {
          targetReps: '6–8',
          note: 'Hinge to ~45°, back flat, pull the bar to your lower ribs, no swinging. Lower slowly.',
        }
      ),
      block(
        'ohp',
        straight(3, 7, 35, [], 8),
        120,
        {
          targetReps: '6–8',
          note: 'Squeeze glutes and abs, bar close to your face, push your head through at the top. No leaning back.',
        }
      ),
      block(
        'pullup',
        straight(3, 7, 0, [], 8),
        120,
        {
          targetReps: '6–8',
          note: 'Full hang, chin over the bar. Hit 8 on every set? Add weight. Cannot do 6? Use assisted machine or lat pulldown 3 × 8–10.',
        }
      ),
      block(
        'lateral-raise',
        straight(3, 15, 8, [], 8),
        45,
        {
          targetReps: '15–20',
          note: 'Light dumbbells, slight forward lean, lead with the elbows, stop at shoulder height. No swinging.',
        }
      ),
      block(
        'pushdown',
        straight(3, 11, 25, [], 8),
        0,
        {
          supersetId: 'ss-upper-a-arm',
          targetReps: '10–12',
          note: 'Superset with EZ-bar curl: do pushdowns, then straight to curls. Elbows pinned to your sides.',
        }
      ),
      block(
        'ez-bar-curl',
        straight(3, 9, 25, [], 8),
        60,
        {
          supersetId: 'ss-upper-a-arm',
          targetReps: '8–10',
          note: 'Rest 60 s after each pair. Do not swing your back.',
        }
      ),
    ],
  },
  {
    id: 'lower-a',
    name: 'Lower A: Squat Focus',
    focus: 'Quads · Hamstrings · Glutes · Calves · Abs',
    color: 'mint',
    estMinutes: 75,
    warmupNote:
      '5 min on the bike. 10 bodyweight squats, 10 glute bridges, 10 leg swings each leg, 10 hip circles each way. Squat ramp-up: empty bar × 8, 40% × 5, 60% × 3, 80% × 2.',
    nutritionNote:
      'Training day: 2000 kcal, 125 g protein. Dinner: egg bhurji with rotis.',
    blocks: [
      block(
        'squat',
        straight(5, 5, 80, [], 8),
        180,
        {
          targetReps: '4–6',
          note: 'Bar on upper back, feet shoulder-width. Brace abs before every rep, sit down between hips, thighs at least parallel, knees track over toes. Use safety bars.',
        }
      ),
      block(
        'rdl',
        straight(3, 7, 70, [], 8),
        120,
        {
          targetReps: '6–8',
          note: 'Soft knees, push hips back, bar slides down thighs to mid-shin, back flat. Feel hamstrings stretch. Lower back sore? Do 2 sets.',
        }
      ),
      block(
        'leg-press',
        straight(3, 9, 140, [], 8),
        90,
        {
          targetReps: '8–10',
          note: 'Feet shoulder-width, middle of platform. Lower to ~90° at knee. Do not lock knees at top.',
        }
      ),
      block(
        'leg-curl',
        straight(3, 11, 40, [], 8),
        60,
        {
          targetReps: '10–12',
          note: '2 seconds up, 3 seconds down. Hips pinned to pad.',
        }
      ),
      block(
        'calf-raise',
        straight(4, 12, 60, [], 8),
        45,
        {
          targetReps: '10–15',
          note: 'Full stretch at bottom, pause 1 second at top. No bouncing.',
        }
      ),
      block(
        'hanging-leg-raise',
        straight(3, 12, 0, [], 8),
        45,
        {
          targetReps: '10–15',
          note: 'Knees to chest if straight legs are too hard. No swinging.',
        }
      ),
    ],
  },
  {
    id: 'upper-b',
    name: 'Upper B: Volume Push & Pull',
    focus: 'Hypertrophy · Chest · Back · Shoulders · Arms',
    color: 'ice',
    estMinutes: 75,
    warmupNote:
      '5 min easy rowing. 15 band pull-aparts, 10 arm circles each way, 10 push-ups. Incline DB ramp-up: light dumbbells × 10, then 70% × 5.',
    nutritionNote:
      'Training day: 2000 kcal, 125 g protein. Egg curry and rotis for dinner, whey scoop at 4:30 pm.',
    blocks: [
      block(
        'incline-db',
        straight(4, 9, 24, [], 8),
        90,
        {
          targetReps: '8–10',
          note: 'Bench at about 30 degrees, elbows about 45 degrees from your body, lower to upper chest.',
        }
      ),
      block(
        'chest-supported-row',
        straight(4, 9, 45, [], 8),
        90,
        {
          targetReps: '8–10',
          note: 'Chest on pad, pull elbows to hips, squeeze 1 second at top.',
        }
      ),
      block(
        'db-shoulder-press',
        straight(3, 9, 18, [], 8),
        90,
        {
          targetReps: '8–10',
          note: 'Seated with back support. Press up and slightly inward. Do not arch back.',
        }
      ),
      block(
        'lat-pulldown',
        straight(3, 11, 50, [], 8),
        60,
        {
          targetReps: '10–12',
          note: 'Pull bar to upper chest, elbows down and back. Do not lean far back.',
        }
      ),
      block(
        'cable-fly',
        straight(3, 13, 15, [], 8),
        0,
        {
          supersetId: 'ss-upper-b-fly-face',
          targetReps: '12–15',
          note: 'Superset with face pull. Slight bend in elbows, think of hugging a tree.',
        }
      ),
      block(
        'face-pull',
        straight(3, 17, 20, [], 8),
        45,
        {
          supersetId: 'ss-upper-b-fly-face',
          targetReps: '15–20',
          note: 'Rope to forehead, elbows high. Fixes rounded shoulders from desk work.',
        }
      ),
      block(
        'overhead-triceps-ext',
        straight(3, 11, 20, [], 8),
        0,
        {
          supersetId: 'ss-upper-b-arm',
          targetReps: '10–12',
          note: 'Superset with hammer curl. Keep elbows pointing forward.',
        }
      ),
      block(
        'hammer-curl',
        straight(3, 11, 14, [], 8),
        45,
        {
          supersetId: 'ss-upper-b-arm',
          targetReps: '10–12',
          note: 'Thumbs up, no swinging.',
        }
      ),
    ],
  },
  {
    id: 'lower-b',
    name: 'Lower B: Deadlift Focus',
    focus: 'Hamstrings · Glutes · Quads · Calves · Core',
    color: 'coral',
    estMinutes: 75,
    warmupNote:
      '5 min on the bike. 10 glute bridges, 10 bodyweight squats, 10 leg swings each leg. Deadlift ramp-up: empty bar × 6, 40% × 4, 60% × 3, 80% × 1.',
    nutritionNote:
      'Training day: 2000 kcal, 125 g protein. Chicken curry and rotis for dinner. Eat enough: hardest session of week.',
    blocks: [
      block(
        'deadlift',
        straight(4, 4, 105, [], 8),
        180,
        {
          targetReps: '3–5',
          note: 'Bar over mid-foot, shoulders just in front of bar, chest up, push floor away, lock hips. Reset on floor every rep. No bouncing.',
        }
      ),
      block(
        'bss',
        straight(3, 9, 16, [], 8),
        90,
        {
          targetReps: '8–10 each leg',
          note: 'Back foot on bench, front shin upright, drop straight down. Hold dumbbells. Start light.',
        }
      ),
      block(
        'hip-thrust',
        straight(3, 9, 85, [], 8),
        90,
        {
          targetReps: '8–10',
          note: 'Upper back on bench, chin tucked, squeeze glutes at top and pause 1 second.',
        }
      ),
      block(
        'leg-extension',
        straight(3, 13, 45, [], 8),
        60,
        {
          targetReps: '12–15',
          note: 'Pause 1 second at top.',
        }
      ),
      block(
        'seated-calf-raise',
        straight(4, 13, 35, [], 8),
        45,
        {
          targetReps: '12–15',
          note: 'Slow and full range.',
        }
      ),
      block(
        'plank',
        straight(3, 60, 0, [], 8),
        30,
        {
          targetReps: '45–60s',
          note: 'Straight line from head to heels, squeeze glutes.',
        }
      ),
    ],
  },
  {
    id: 'cardio-core',
    name: 'Cardio & Core',
    focus: 'Zone 2 Aerobic · Core Stability',
    color: 'amber',
    estMinutes: 45,
    warmupNote: '5 min easy pace on bike, incline walk or light jog.',
    nutritionNote:
      'Rest/Cardio day: ~1806 kcal, 125 g protein. Shakshuka breakfast, chicken masala lunch, soya curry dinner.',
    blocks: [
      block(
        'zone2-cardio',
        straight(1, 28, 0),
        60,
        {
          targetReps: '25–30 min',
          note: 'Steady and easy. Speak in full sentences. Heart rate ~130–140 bpm. (Optional 6 rounds intervals: 30s hard / 90s easy).',
        }
      ),
      block(
        'plank',
        straight(3, 45, 0),
        30,
        {
          targetReps: '45s',
          note: 'Straight line from head to heels, squeeze glutes.',
        }
      ),
      block(
        'dead-bug',
        straight(3, 10, 0),
        30,
        {
          targetReps: '10 per side',
          note: 'Slow tempo, lower back glued to floor. Opposite arm and leg extend.',
        }
      ),
      block(
        'side-plank',
        straight(2, 30, 0),
        30,
        {
          targetReps: '30s per side',
          note: 'Elbow under shoulder, hips lifted, neutral spine.',
        }
      ),
      block(
        'bird-dog',
        straight(2, 10, 0),
        30,
        {
          targetReps: '10 per side',
          note: 'Reach long without rotating hips. Pause 1s at extension.',
        }
      ),
    ],
  },
  {
    id: 'rest-mobility',
    name: 'Rest: Walk & Mobility',
    focus: 'Active Recovery · Hips & Spine',
    color: 'lav',
    estMinutes: 15,
    warmupNote: 'Walk 8,000–10,000 steps daily. Two short 10–15 min walks after lunch and dinner.',
    nutritionNote: 'Rest day: 1850 kcal, 120 g protein. Wednesday: soya keema. Sunday: chicken-egg hash.',
    blocks: [
      block(
        'mobility-flow',
        straight(1, 10, 0),
        30,
        {
          targetReps: '10 min',
          note: 'Couch stretch 60s/leg, Glute bridge 2x15, Doorway chest stretch 30s/side, Band pull-apart 2x15, Thoracic extension 10 reps, Cat-cow 10 reps.',
        }
      ),
    ],
  },
];

export const MOCK_PLAN: PlanDay[] = [
  { weekday: 0, routineId: 'upper-a' },
  { weekday: 1, routineId: 'lower-a' },
  { weekday: 2, routineId: null }, // Wednesday: Rest: walk and mobility
  { weekday: 3, routineId: 'upper-b' },
  { weekday: 4, routineId: 'lower-b' },
  { weekday: 5, routineId: 'cardio-core' },
  { weekday: 6, routineId: null }, // Sunday: Full rest
];

export const DEFAULT_SETTINGS: Settings = {
  unit: 'kg',
  barWeight: 20,
  defaultRest: 120,
  haptics: true,
  sound: true,
  autoStartRest: true,
  weeklyGoal: 5,
  bodyweight: 58.5,
  name: 'Barath',
};

// Note: History is not mocked. Sessions only populate when the user logs and finishes workouts.

