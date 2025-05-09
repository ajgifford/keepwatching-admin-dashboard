export interface ShowDetails {
  id: number;
  tmdbId: number;
  title: string;
  description: string;
  releaseDate: string;
  posterImage: string;
  backdropImage: string | null;
  network: string;
  seasonCount: number;
  episodeCount: number;
  status: string;
  type: string;
  inProduction: boolean;
  lastAirDate: string;
  lastUpdated: string;
  streamingServices: string;
  genres: string;
}

export interface Episode {
  id: number;
  tmdbId: number;
  seasonId: number;
  showId: number;
  episodeNumber: number;
  episodeType: string;
  seasonNumber: number;
  title: string;
  overview: string;
  airDate: string;
  runtime: number | null;
  stillImage: string;
  createdAt: string;
  updatedAt: string;
}

export interface Season {
  id: number;
  tmdbId: number;
  name: string;
  overview: string;
  seasonNumber: number;
  releaseDate: string;
  posterImage: string;
  episodeCount: number;
  createdAt: string;
  updatedAt: string;
  episodes: Episode[];
}

export interface ProfileWatchStatus {
  profileId: number;
  name: string;
  showStatus: string;
  totalEpisodes: number;
  watchedEpisodes: number;
  percentComplete: number;
  seasons: {
    seasonId: number;
    seasonNumber: number;
    name: string;
    status: string;
    episodeCount: number;
    watchedEpisodes: number;
    percentComplete: number;
  }[];
}

export interface Profile {
  profileId: number;
  name: string;
  image: string | null;
  accountId: number;
  accountName: string;
  watchStatus: string;
  addedDate: string;
  lastUpdated: string;
}

export interface ShowData {
  details: ShowDetails;
  seasons: Season[];
  profiles: Profile[];
  watchProgress: ProfileWatchStatus[];
}
