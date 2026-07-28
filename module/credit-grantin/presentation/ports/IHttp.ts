export interface IHttpRequest {
    body: unknown;
}

export interface IHttpResponse {
    statusCode: number;
    body: unknown;
}

export interface IController {
    handle(request: IHttpRequest): Promise<IHttpResponse>;
}
