/**
 * POST /store-api-key endpoint - Store API key
 */

import type { Request, Response } from "express";
import {
  setApiKey,
  persistApiKeyToEnv,
  getErrorMessage,
  logError,
} from "../common.js";
import { createLogger } from "../../../lib/logger.js";

const logger = createLogger("Setup");

export function createStoreApiKeyHandler() {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const { provider, apiKey } = req.body as {
        provider: string;
        apiKey: string;
      };

      if (!provider || !apiKey) {
        res
          .status(400)
          .json({ success: false, error: "provider and apiKey required" });
        return;
      }

      setApiKey(provider, apiKey);

      // Also set as environment variable and persist to .env
      // IMPORTANT: OAuth tokens and API keys must be stored separately
      // - OAuth tokens (subscription auth) -> CLAUDE_CODE_OAUTH_TOKEN
      // - API keys (pay-per-use) -> ANTHROPIC_API_KEY
      if (provider === "anthropic_oauth_token") {
        // OAuth token from claude setup-token (subscription-based auth)
        process.env.CLAUDE_CODE_OAUTH_TOKEN = apiKey;
        await persistApiKeyToEnv("CLAUDE_CODE_OAUTH_TOKEN", apiKey);
        logger.info("[Setup] Stored OAuth token as CLAUDE_CODE_OAUTH_TOKEN");
      } else if (provider === "anthropic") {
        // Direct API key (pay-per-use)
        process.env.ANTHROPIC_API_KEY = apiKey;
        await persistApiKeyToEnv("ANTHROPIC_API_KEY", apiKey);
        logger.info("[Setup] Stored API key as ANTHROPIC_API_KEY");
      } else if (provider === "google") {
        process.env.GOOGLE_API_KEY = apiKey;
        await persistApiKeyToEnv("GOOGLE_API_KEY", apiKey);
      }

      res.json({ success: true });
    } catch (error) {
      logError(error, "Store API key failed");
      res.status(500).json({ success: false, error: getErrorMessage(error) });
    }
  };
}
