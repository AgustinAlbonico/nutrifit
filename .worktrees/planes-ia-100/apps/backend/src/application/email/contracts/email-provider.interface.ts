export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  gimnasioId?: number;
}

export interface IEmailProvider {
  enviar(payload: EmailPayload): Promise<void>;
}
