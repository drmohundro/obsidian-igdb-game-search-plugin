export interface Game {
  // Basic Info
  id: number;
  name: string;
  slug?: string;

  // Dates
  releaseDate?: string; // Formatted date string
  releaseYear?: number;

  // Companies
  developer?: string;
  developers?: string[];
  publisher?: string;
  publishers?: string[];
  developerLogo?: string;

  // Classification
  genres?: string[];
  genresFormatted?: string;
  gameModes?: string[];
  gameModesFormatted?: string;
  platforms?: string[];
  platformsFormatted?: string;

  // Media
  coverUrl?: string;
  coverSmallUrl?: string;
  coverBigUrl?: string;
  screenshotUrl?: string;
  localCoverImage?: string;

  // Content
  summary?: string;
  storyline?: string;

  // Ratings
  rating?: number; // IGDB rating
  ratingCount?: number;
  aggregatedRating?: number;
  aggregatedRatingCount?: number;

  // Links
  url?: string; // IGDB URL
  websiteUrl?: string;

  // User tracking (for templates)
  status?: string;
  myRating?: number | string;
  playedDate?: string;
  completedDate?: string;
  notes?: string;
}

export interface IGDBGame {
  id: number;
  name: string;
  slug?: string;
  first_release_date?: number;
  cover?: {
    id: number;
    url: string;
  };
  genres?: Array<{
    id: number;
    name: string;
  }>;
  game_modes?: Array<{
    id: number;
    name: string;
  }>;
  platforms?: Array<{
    id: number;
    name: string;
    abbreviation?: string;
  }>;
  involved_companies?: Array<{
    id: number;
    developer: boolean;
    publisher: boolean;
    company: {
      id: number;
      name: string;
      logo?: {
        id: number;
        url: string;
      };
    };
  }>;
  summary?: string;
  storyline?: string;
  rating?: number;
  rating_count?: number;
  aggregated_rating?: number;
  aggregated_rating_count?: number;
  url?: string;
  websites?: Array<{
    id: number;
    url: string;
    category: number;
  }>;
}

export interface IGDBAuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface IGDBTokenData {
  accessToken: string;
  expiresAt: number;
}
