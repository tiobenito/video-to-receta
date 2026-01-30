export interface Ingredient {
  amount: string;
  item: string;
}

export interface Instruction {
  step: number;
  text: string;
}

export interface Recipe {
  id: string;
  youtubeUrl: string;
  videoId: string;
  videoTitle: string | null;
  channelName: string | null;
  title: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  prepTime: string | null;
  cookTime: string | null;
  servings: string | null;
  cached: boolean;
}

export interface ConvertRequest {
  url: string;
}

export interface ErrorResponse {
  detail: string;
}
