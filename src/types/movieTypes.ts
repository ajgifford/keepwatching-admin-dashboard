export interface MovieDetails {
  id: number;
  tmdbId: number;
  title: string;
  description: string;
  releaseDate: string;
  runtime: number;
  posterImage: string;
  backdropImage: string;
  userRating: number;
  mpaRating: string;
  streamingServices: string;
  genres: string;
  lastUpdated: string;
}

export interface MovieProfile {
  profileId: number;
  name: string;
  image: string | null;
  accountId: number;
  accountName: string;
  watchStatus: string;
  addedDate: string;
  lastUpdated: string;
}

export interface MovieData {
  details: MovieDetails;
  profiles: MovieProfile[];
}
