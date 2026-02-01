// Waste Collection Types
export type WasteType = 'restmuell' | 'papier' | 'gelbesack' | 'bio' | 'laubsaecke';

export interface WasteCollection {
  id: string;
  date: Date;
  type: WasteType;
  street?: string;
}

export interface WasteSettings {
  street: string;
  houseNumber: string;
  enabledTypes: WasteType[];
  notifications: boolean;
  // Persönliche SBAZV ICS-URL für diese Adresse
  icsUrl?: string;
}

// Traffic/Construction Types
export type ConstructionType = 'road' | 'highway' | 'rail' | 'bridge' | 'utility' | 'other';
export type ConstructionStatus = 'planned' | 'active' | 'completed' | 'cancelled';
export type ConstructionImpactLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Construction {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate?: Date;
  status: ConstructionStatus;
  source: string;
  sourceUrl?: string;
  type?: ConstructionType;
  category?: string;
  impactLevel?: ConstructionImpactLevel;
  trafficImpact?: string;
  detourInfo?: string;
  isFeatured?: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// DB Construction (snake_case) - für API-Responses
export interface DBConstruction {
  id: string;
  title: string;
  description: string | null;
  location: string;
  type: ConstructionType;
  category: string | null;
  start_date: string;
  end_date: string | null;
  status: ConstructionStatus;
  impact_level: ConstructionImpactLevel;
  traffic_impact: string | null;
  detour_info: string | null;
  latitude: number | null;
  longitude: number | null;
  source: string | null;
  source_url: string | null;
  is_featured: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

// Konverter von DB zu Frontend
export function dbToConstruction(db: DBConstruction): Construction {
  return {
    id: db.id,
    title: db.title,
    description: db.description || '',
    location: db.location,
    startDate: new Date(db.start_date),
    endDate: db.end_date ? new Date(db.end_date) : undefined,
    status: db.status,
    source: db.source || '',
    sourceUrl: db.source_url || undefined,
    type: db.type,
    category: db.category || undefined,
    impactLevel: db.impact_level,
    trafficImpact: db.traffic_impact || undefined,
    detourInfo: db.detour_info || undefined,
    isFeatured: db.is_featured,
    coordinates: db.latitude && db.longitude ? { lat: db.latitude, lng: db.longitude } : undefined,
  };
}

// Event Types - Re-export from database types for consistency
// The database Event type uses snake_case which matches API responses
export type {
  Event,
  EventCategory,
  EventType,
  EventInsert,
  EventUpdate,
  EventSuggestion,
  EventSuggestionStatus,
  EventSuggestionWithBusinesses,
  EventSuggestionForm,
  EventSuggestionInsert,
  EventSuggestionUpdate,
} from './database';

// History Types
export interface HistoryEntry {
  id: string;
  year: number;
  title: string;
  description: string;
  imageUrl?: string;
  category: 'founding' | 'development' | 'war' | 'modern' | 'culture';
}

// User Types
export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

export interface UserSettings {
  userId?: string;
  wasteSettings?: WasteSettings;
  language: 'de' | 'en';
  theme: 'light' | 'dark' | 'system';
}

// Local Storage Settings (for non-account users)
export interface LocalSettings {
  wasteSettings?: WasteSettings;
  language: 'de' | 'en';
  theme: 'light' | 'dark' | 'system';
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// ============================================
// LEARNING PLATFORM TYPES
// ============================================

// Basis-Typen
export type GradeStage = 'grundschule' | 'sekundarstufe1' | 'sekundarstufe2';
export type LearningUnitType = 'video' | 'exercise' | 'infographic' | 'quiz' | 'text' | 'interactive';
export type QuestionType = 'multiple_choice' | 'fill_blank' | 'drag_drop' | 'free_text' | 'matching' | 'ordering' | 'true_false';
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

// Fach
export interface Subject {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color: string;
  isActive: boolean;
  orderIndex: number;
}

// Klassenstufe
export interface GradeLevel {
  id: string;
  level: number;
  name: string;
  stage: GradeStage;
  description?: string;
  minAge?: number;
  maxAge?: number;
  isActive: boolean;
}

// Lernmodul
export interface LearningModule {
  id: string;
  subjectId: string;
  gradeLevelId: string;
  title: string;
  slug: string;
  description?: string;
  learningGoals?: string[];
  estimatedDurationMinutes: number;
  orderIndex: number;
  isPublished: boolean;
  thumbnailUrl?: string;
  // Computed
  progress?: number;
  completedUnits?: number;
  totalUnits?: number;
}

// Thema
export interface Topic {
  id: string;
  moduleId: string;
  title: string;
  slug: string;
  description?: string;
  difficulty: number;
  orderIndex: number;
  isPublished: boolean;
  // Computed
  progress?: number;
  completedUnits?: number;
  totalUnits?: number;
}

// Lerneinheit
export interface LearningUnit {
  id: string;
  topicId: string;
  type: LearningUnitType;
  title: string;
  description?: string;
  content?: Record<string, unknown>;
  mediaUrl?: string;
  thumbnailUrl?: string;
  durationMinutes?: number;
  aiGenerated: boolean;
  generationPrompt?: string;
  orderIndex: number;
  isPublished: boolean;
  // Computed
  isCompleted?: boolean;
  userProgress?: UserProgress;
}

// Übung
export interface Exercise {
  id: string;
  learningUnitId: string;
  questionType: QuestionType;
  question: string;
  questionMediaUrl?: string;
  options?: string[] | Record<string, string>[];
  correctAnswer: string | string[] | Record<string, string>;
  explanation?: string;
  hint?: string;
  points: number;
  difficulty: number;
  tags?: string[];
  aiGenerated: boolean;
  orderIndex: number;
}

// Benutzer-Fortschritt
export interface UserProgress {
  id: string;
  userId: string;
  learningUnitId: string;
  status: ProgressStatus;
  score: number;
  maxScore: number;
  attempts: number;
  timeSpentSeconds: number;
  lastPosition?: Record<string, unknown>;
  startedAt?: Date;
  completedAt?: Date;
}

// Übungs-Versuch
export interface ExerciseAttempt {
  id: string;
  userId: string;
  exerciseId: string;
  userAnswer: string | string[] | Record<string, string>;
  isCorrect: boolean;
  pointsEarned: number;
  timeSpentSeconds?: number;
  hintUsed: boolean;
  attemptNumber: number;
  createdAt: Date;
}

// Benutzer-Statistiken
export interface UserStats {
  userId: string;
  xpTotal: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  coins: number;
  totalTimeSeconds: number;
  exercisesCompleted: number;
  exercisesCorrect: number;
  unitsCompleted: number;
  modulesCompleted: number;
  lastActivityDate?: Date;
}

// Badge
export interface Badge {
  id: string;
  name: string;
  description?: string;
  icon: string;
  imageUrl?: string;
  requirementType: 'xp' | 'streak' | 'completion' | 'subject' | 'speed' | 'accuracy' | 'special';
  requirementValue?: number;
  requirementDetails?: Record<string, unknown>;
  rarity: BadgeRarity;
  xpReward: number;
  coinReward: number;
  isActive: boolean;
}

// Benutzer-Badge
export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge?: Badge;
  earnedAt: Date;
}

// Level
export interface Level {
  level: number;
  name: string;
  xpRequired: number;
  icon?: string;
  rewards?: Record<string, unknown>;
}

// Shop-Artikel
export interface ShopItem {
  id: string;
  name: string;
  description?: string;
  category: 'avatar' | 'theme' | 'badge_frame' | 'title' | 'effect';
  imageUrl?: string;
  itemData?: Record<string, unknown>;
  coinPrice: number;
  isAvailable: boolean;
}

// Tägliche Herausforderung
export interface DailyChallenge {
  id: string;
  date: Date;
  challengeType: string;
  challengeData: Record<string, unknown>;
  xpReward: number;
  coinReward: number;
  isCompleted?: boolean;
}

// Leaderboard-Eintrag
export interface LeaderboardEntry {
  userId: string;
  username?: string;
  avatarUrl?: string;
  xpEarned: number;
  exercisesCompleted: number;
  rank: number;
  weekStart: Date;
}

// XP-Aktionen
export const XP_REWARDS = {
  VIDEO_WATCHED: 20,
  EXERCISE_CORRECT_FIRST: 15,
  EXERCISE_CORRECT_RETRY: 10,
  TOPIC_COMPLETED: 50,
  MODULE_COMPLETED: 200,
  DAILY_LOGIN: 5,
  STREAK_7_DAYS: 100,
  STREAK_30_DAYS: 500,
} as const;

// Level-Berechnung
export function calculateLevel(xp: number): number {
  if (xp < 5000) {
    return Math.floor(xp / 500) + 1;
  } else if (xp < 20000) {
    return Math.floor((xp - 5000) / 1000) + 11;
  } else if (xp < 70000) {
    return Math.floor((xp - 20000) / 2000) + 26;
  } else {
    return Math.floor((xp - 70000) / 5000) + 51;
  }
}

// XP für nächstes Level
export function xpForNextLevel(currentLevel: number): number {
  if (currentLevel < 10) {
    return (currentLevel) * 500;
  } else if (currentLevel < 25) {
    return 5000 + (currentLevel - 10) * 1000;
  } else if (currentLevel < 50) {
    return 20000 + (currentLevel - 25) * 2000;
  } else {
    return 70000 + (currentLevel - 50) * 5000;
  }
}

// Altersgruppe basierend auf Klassenstufe
export function getAgeGroup(gradeLevel: number): 'child' | 'teen' | 'young_adult' {
  if (gradeLevel <= 4) return 'child';
  if (gradeLevel <= 10) return 'teen';
  return 'young_adult';
}
