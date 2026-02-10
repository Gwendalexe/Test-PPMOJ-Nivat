export interface Formation {
  id: number;
  name: string;
  category: number;
  description: string;
  price: number;
  img_link: string;
  document_link: string;
  displayed: boolean;
}

export interface FormationSession {
  formation_id: number;
  formation_availability_id: number;
  delivery_date: Date;
  duration_minutes: number;
  speaker: string;
  live_link: string | null;
  replay_link: string | null;
  calculated_jour: string | null;
  calculated_horaire: string | null;
}

export interface FormationExtended extends Formation {
  owned: boolean;
  sessions: FormationSession[];
}

export interface FormationCategory {
  id: number;
  category_name: string;
  code: string;
  category_description: string;
}
