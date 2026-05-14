export type HttpResponse = {
  readonly status: number;
  readonly text: string;
};

export type HttpClient = {
  get(url: string, headers?: Readonly<Record<string, string>>): Promise<HttpResponse>;
};

export const fetchHttpClient: HttpClient = {
  async get(url, headers) {
    const response = await fetch(url, { headers });
    const text = await response.text();
    return { status: response.status, text };
  },
};
