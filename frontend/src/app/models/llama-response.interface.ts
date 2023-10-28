export interface LlamaResponseResult {
  result: LlamaResponse[];
}

export interface LlamaResponse {
  url: string;
  description: string;
  sysId: string;
  type: string;
  language: string;
}
