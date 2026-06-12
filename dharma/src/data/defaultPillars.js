export const DEFAULT_PILLARS = [
  {
    id: 'nidra',
    sanskrit: 'निद्रा',
    english: 'Sleep',
    icon: 'moon',
    color: '#5A8A8A',
    targets: [
      { id: 'nidra-bedtime', name: 'Bedtime', sanskrit: 'शयनकाल', type: 'TIME', targetValue: '23:00', comparison: 'lte', frequency: 'daily', reminder: null },
      { id: 'nidra-wake', name: 'Wake time', sanskrit: 'उत्थानकाल', type: 'TIME', targetValue: '06:30', comparison: 'lte', frequency: 'daily', reminder: null },
      { id: 'nidra-noPhone', name: 'No phone 30 min before bed', sanskrit: 'मौन स्क्रीन', type: 'CHECKBOX', targetValue: true, frequency: 'daily', reminder: null },
      { id: 'nidra-noCaffeine', name: 'No caffeine after 2 PM', sanskrit: 'कैफ़ीन त्याग', type: 'CHECKBOX', targetValue: true, frequency: 'daily', reminder: null },
    ],
  },
  {
    id: 'ahara',
    sanskrit: 'आहार',
    english: 'Food',
    icon: 'bowl',
    color: '#E8843C',
    targets: [
      { id: 'ahara-breakfast', name: 'Breakfast with protein', sanskrit: 'प्रातः आहार', type: 'CHECKBOX', targetValue: true, frequency: 'daily', reminder: null },
      { id: 'ahara-vegetables', name: 'Half-plate vegetables at lunch', sanskrit: 'शाकाहार', type: 'CHECKBOX', targetValue: true, frequency: 'daily', reminder: null },
      { id: 'ahara-dinner', name: 'Light dinner before 9 PM', sanskrit: 'रात्रि भोजन', type: 'TIME', targetValue: '21:00', comparison: 'lte', frequency: 'daily', reminder: null },
      { id: 'ahara-water', name: 'Water intake (litres)', sanskrit: 'जल', type: 'NUMBER', targetValue: 3, unit: 'L', comparison: 'gte', frequency: 'daily', reminder: null },
      { id: 'ahara-noSugar', name: 'No refined sugar today', sanskrit: 'मीठा त्याग', type: 'CHECKBOX', targetValue: true, frequency: 'daily', reminder: null },
    ],
  },
  {
    id: 'vyayama',
    sanskrit: 'व्यायाम',
    english: 'Gym',
    icon: 'dumbbell',
    color: '#2D3561',
    targets: [
      { id: 'vyayama-workout', name: 'Workout completed', sanskrit: 'व्यायाम', type: 'CHECKBOX', targetValue: true, frequency: 'daily', reminder: null },
      { id: 'vyayama-duration', name: 'Workout duration (minutes)', sanskrit: 'समय', type: 'NUMBER', targetValue: 45, unit: 'min', comparison: 'gte', frequency: 'daily', reminder: null },
      { id: 'vyayama-weekly', name: 'Weekly workouts', sanskrit: 'साप्ताहिक', type: 'NUMBER', targetValue: 4, unit: 'sessions', comparison: 'gte', frequency: 'weekly', reminder: null },
    ],
  },
];
