export interface LlamaResponseResult {
  result: LlamaResponse[];
  answer: string;
}

export interface LlamaResponse {
  url: string;
  description: string;
  sysId: string;
  type: string;
  language: string;
}
