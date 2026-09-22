export interface DiagonalFlags {
  q: boolean;
  r: boolean;
}

export interface Stats {
  max: number;
  min: number;
  sum: number;
  average: number;
  diagonal: DiagonalFlags;
}

export interface QrResponse {
  q: number[][];
  r: number[][];
  stats: Stats;
}

export interface TokenResponse {
  token: string;
  expiresIn: number;
}
