import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users, callHistory, notifications } from "@shared/schema";

let db: ReturnType<typeof drizzle> | null = null;

if (process.env.DATABASE_URL) {
  const baseSql = neon(process.env.DATABASE_URL);
  
  const handler: ProxyHandler<typeof baseSql> = {
    apply(target, thisArg, argArray) {
      const maxRetries = 3;
      const attempt = async (n: number): Promise<any> => {
        try {
          return await Reflect.apply(target, thisArg, argArray);
        } catch (error: any) {
          if (error?.message?.includes("Cannot read properties of null") && n < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 100 * n));
            return attempt(n + 1);
          }
          throw error;
        }
      };
      return attempt(1);
    }
  };
  
  const retryingSql = new Proxy(baseSql, handler);
  
  db = drizzle(retryingSql, { schema: { users, callHistory, notifications } });
}

export { db };
