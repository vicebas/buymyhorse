declare module "pg" {
  export type PoolConfig = {
    connectionString?: string;
    host?: string;
    port?: number;
    user?: string;
    database?: string;
    ssl?: boolean;
    password?: string | (() => Promise<string>);
  };

  export class Pool {
    constructor(config?: PoolConfig);
  }
}
