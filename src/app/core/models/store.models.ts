export interface StoreApp {
  id: string;
  name: string;
  developer: string;
  iconUrl: string;
  bannerUrl?: string;
  category: string;
  rating: number;
  downloads: number;
  shortDescription: string;
  description: string;
  screenshots: string[];
  specs: {
    size: string;
    version: string;
    updatedAt: string;
    contentRating: string;
  };
}

export interface StoreReviewResponse {
  reviews: Array<{
    reviewId: string;
    authorName: string;
    comments: Array<{
      userComment?: {
        text: string;
        lastModified: { seconds: string; nanos: number };
        starRating: number;
      };
      developerComment?: {
        text: string;
        lastModified: { seconds: string; nanos: number };
      };
    }>;
  }>;
  tokenPagination?: {
    nextPageToken?: string;
  };
}
