export interface FreshdeskArticle {
  id: string;
  type: number;
  status: number;
  agent_id: number;
  created_at: string;
  category_id: number;
  folder_id: number;
  title: string;
  updated_at: string;
  description: string;
  description_text: string;
  seo_data: {
    meta_title: string;
    meta_description: string;
  };
  tags: string[];
  attachments: string[];
  cloud_files: string[];
  thumbs_up: number;
  thumbs_down: number;
  hits: number;
  suggested: number;
  feedback_count: number;
}

export interface HelpdeskData {
  title: string;
  articles: FreshdeskArticle[];
}

export interface HelpdeskContextType {
  isOpen: boolean;
  data: HelpdeskData | null;
  open: () => void;
  close: () => void;
  loadData: (folder: string, title: string) => Promise<void>;
}
