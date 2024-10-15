export enum Env {
  Dev = "test",
  Prod = "prod",
}

export function getEnvironment(): Env {
  return process.env.NODE_ENV === 'production' ? Env.Prod : Env.Dev;
}


export const responseOk = { status: 'ok' };
export const responseNoHandlers = { status: 'no_handlers' };
