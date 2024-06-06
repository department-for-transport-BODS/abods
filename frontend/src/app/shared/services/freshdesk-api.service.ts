import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DateTime } from 'luxon';
import { Observable, catchError, map, of, retry } from 'rxjs';
import { ConfigService, FreshdeskFolderConfig } from '../../config/config.service';

export interface FreshdeskArticle {
  id: string;
  type: number;
  status: FreshdeskArticleStatus;
  agent_id: number;
  created_at: DateTime;
  category_id: number;
  folder_id: number;
  title: string;
  updated_at: DateTime;
  description: string;
  description_text: string;
  seo_data: {
    meta_title: string;
    meta_description: string;
  };
  tags: any[];
  attachments: any[];
  cloud_files: any[];
  thumbs_up: number;
  thumbs_down: number;
  hits: number;
  suggested: number;
  feedback_count: number;
}

export enum FreshdeskArticleStatus {
  DRAFT = 1,
  PUBLISHED = 2,
}

@Injectable({
  providedIn: 'root',
})
export class FreshdeskApiService {
  constructor(private configService: ConfigService, private http: HttpClient) {}

  private readonly freshdeskConfig = this.configService.freshdeskConfig;

  getFolder(folder: keyof FreshdeskFolderConfig): Observable<FreshdeskArticle[]> {
    if (folder) {
      return this.http
        .get<FreshdeskArticle[]>(this.freshdeskConfig.apiUrl + this.freshdeskConfig.folders[folder], {
          observe: 'body',
          responseType: 'json',
          withCredentials: true,
        })
        .pipe(
          retry(3),
          map((articles: FreshdeskArticle[]) =>
            articles.filter((article) => article.status === FreshdeskArticleStatus.PUBLISHED)
          ),
          catchError(() => of([]))
        );
    } else {
      return of([]);
    }
  }
}
