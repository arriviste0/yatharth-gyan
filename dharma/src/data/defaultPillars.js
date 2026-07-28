export const DEFAULT_PILLARS = [
  {
    id: 'nidra',
    sanskrit: 'निद्रा',
    english: 'Sleep',
    icon: 'moon',
    color: '#5A8A8A',
    targets: [
      { id: 'nidra-bedtime',    name: 'Bedtime',                    type: 'TIME',     unit: '',    frequency: 'daily',  reminder: null },
      { id: 'nidra-wake',       name: 'Wake time',                  type: 'TIME',     unit: '',    frequency: 'daily',  reminder: null },
      { id: 'nidra-noPhone',    name: 'No phone 30 min before bed', type: 'CHECKBOX', unit: '',    frequency: 'daily',  reminder: null },
      { id: 'nidra-noCaffeine', name: 'No caffeine after 2 PM',     type: 'CHECKBOX', unit: '',    frequency: 'daily',  reminder: null },
    ],
  },
  {
    id: 'ahara',
    sanskrit: 'आहार',
    english: 'Food',
    icon: 'bowl',
    color: '#F05A36',
    targets: [
      { id: 'ahara-breakfast',  name: 'Breakfast with protein',         type: 'CHECKBOX', unit: '',   frequency: 'daily',  reminder: null },
      { id: 'ahara-vegetables', name: 'Half-plate vegetables at lunch',  type: 'CHECKBOX', unit: '',   frequency: 'daily',  reminder: null },
      { id: 'ahara-dinner',     name: 'Light dinner time',               type: 'TIME',     unit: '',   frequency: 'daily',  reminder: null },
      { id: 'ahara-water',      name: 'Water intake',                    type: 'NUMBER',   unit: 'L',  frequency: 'daily',  reminder: null },
      { id: 'ahara-noSugar',    name: 'No refined sugar today',          type: 'CHECKBOX', unit: '',   frequency: 'daily',  reminder: null },
    ],
  },
  {
    id: 'vyayama',
    sanskrit: 'व्यायाम',
    english: 'Gym',
    icon: 'dumbbell',
    color: '#2D3561',
    targets: [
      { id: 'vyayama-workout',  name: 'Workout completed',          type: 'CHECKBOX', unit: '',        frequency: 'daily',   reminder: null },
      { id: 'vyayama-duration', name: 'Workout duration',           type: 'DURATION', unit: 'min',     frequency: 'daily',   reminder: null },
      { id: 'vyayama-weekly',   name: 'Weekly workouts',            type: 'NUMBER',   unit: 'sessions',frequency: 'weekly',  reminder: null },
    ],
  },
];
