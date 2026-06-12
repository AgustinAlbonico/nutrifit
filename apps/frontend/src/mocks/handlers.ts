import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/health', () => {
    return HttpResponse.json({ status: 'ok' });
  }),
  http.get('/gimnasios', () => {
    return HttpResponse.json({ success: true, message: 'ok', data: [] });
  }),
  http.get('/profesional', () => {
    return HttpResponse.json({ success: true, message: 'ok', data: [] });
  }),
];
