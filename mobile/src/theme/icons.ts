import {
  CheckpointType,
  Difficulty,
  RouteCategory,
  TipType,
} from '../types/api';

/** MaterialCommunityIcons names mapped from domain enums. */

export const categoryIcon: Record<RouteCategory, string> = {
  HISTORICAL: 'bank-outline',
  BATTLE: 'sword-cross',
  SCENIC: 'image-filter-hdr',
  GATHERING_SPOT: 'account-group-outline',
  MIXED: 'shuffle-variant',
};

export const checkpointIcon: Record<CheckpointType, string> = {
  HISTORICAL: 'book-open-page-variant-outline',
  DANGER: 'alert-octagon-outline',
  UPCOMING: 'flag-outline',
  INFO: 'information-outline',
};

export const difficultyIcon: Record<Difficulty, string> = {
  EASY: 'speedometer-slow',
  MODERATE: 'speedometer-medium',
  HARD: 'speedometer',
};

export const tipIcon: Record<TipType, string> = {
  WARNING: 'alert-outline',
  ADVICE: 'lightbulb-on-outline',
};
