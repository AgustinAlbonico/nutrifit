import { SetMetadata } from '@nestjs/common';

export const ACTIONS_KEY = 'actions';
export const Actions = (...actions: string[]) =>
  SetMetadata(ACTIONS_KEY, actions);
