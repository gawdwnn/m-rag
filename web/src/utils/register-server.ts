type QueryParams = Record<string, string | number | boolean | undefined>;

type RequestClient = {
  (url: string, options?: { method?: string; data?: unknown; params?: QueryParams }): unknown;
  get: (url: string, options?: { params?: QueryParams }) => unknown;
};

type Server<T extends string> = Record<T, (params?: unknown, urlAppendix?: string) => unknown>;

const Methods = ['post', 'delete', 'put', 'patch'];

const registerServer = <T extends string>(
  opt: Record<T, { url: string; method: string }>,
  request: RequestClient,
) => {
  const server: Server<T> = {} as Server<T>;
  for (const key in opt) {
    server[key] = (params?: unknown, urlAppendix?: string) => {
      let url = opt[key].url;
      if (urlAppendix) {
        url = `${url}/${urlAppendix}`;
      }
      if (Methods.includes(opt[key].method.toLowerCase())) {
        return request(url, {
          method: opt[key].method,
          data: params,
        });
      }

      if (opt[key].method.toLowerCase() === 'get') {
        return request.get(url, {
          params: params as QueryParams,
        });
      }
      return request(url, { method: opt[key].method });
    };
  }
  return server;
};

export default registerServer;
