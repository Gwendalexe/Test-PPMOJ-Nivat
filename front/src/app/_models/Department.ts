export interface Department {
  number: number;
  name: string;
  coordinates: string;
  region: string;
  zones: Zone[];
  color: any;
}

export interface Zone {
  x: number;
  y: number;
  radius: number;
}
