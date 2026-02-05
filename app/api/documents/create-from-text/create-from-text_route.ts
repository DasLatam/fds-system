/**
 * NOTE:
 * This file is kept only for legacy/backup purposes and MUST compile under TypeScript.
 * The real Next.js App Router handler for this endpoint lives in:
 *   app/api/documents/create-from-text/route.ts
 *
 * We re-export the handler here to avoid duplicate logic and to prevent build failures
 * if this file is accidentally included in the TypeScript program.
 */
export { POST } from "./route";

export const runtime = "nodejs";
