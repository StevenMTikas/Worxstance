/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {setGlobalOptions} from "firebase-functions";
import cors from "cors";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({maxInstances: 5}, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({maxInstances: 10}) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

const corsHandler = cors({origin: true});

export const adzunaProxy = onRequest((request, response) => {
  corsHandler(request, response, async () => {
    try {
      // Allow both body (POST) and query (GET) for flexibility.
      // POST is preferred so credentials are not placed in the URL.
      let rawParams = request.query;
      if (request.method === "POST") {
        rawParams = request.body;
      }

      let params: Record<string, unknown> | undefined =
        rawParams as Record<string, unknown>;
      if (typeof rawParams === "string") {
        params = JSON.parse(rawParams) as Record<string, unknown>;
      }
      if (!params || typeof params !== "object") {
        response.status(400).json({error: "Invalid request payload"});
        return;
      }

      const normalizeParam = (value: unknown, fallback = ""): string => {
        if (Array.isArray(value)) {
          return normalizeParam(value[0], fallback);
        }
        if (typeof value === "string") {
          return value;
        }
        if (value === null || value === undefined) {
          return fallback;
        }
        return String(value);
      };

      const appId = normalizeParam(params.app_id);
      const appKey = normalizeParam(params.app_key);
      const whatQuery = normalizeParam(params.what);
      const whereQuery = normalizeParam(params.where);
      const resultsPerPage = normalizeParam(params.results_per_page, "3");
      const contentType = normalizeParam(params.content_type, "job");
      const remoteFlag = normalizeParam(params.isRemote).toLowerCase();

      if (!appId || !appKey) {
        response.status(400).json({error: "Missing API credentials"});
        return;
      }

      const fallbackUserAgent = "WorxstanceJobDiscovery/1.0 (+https://worxstance.com)";
      const rawForwardedIp = request.get("x-forwarded-for") ||
        request.get("fastly-client-ip");

      const userIpSource = rawForwardedIp ||
        request.socket.remoteAddress ||
        "0.0.0.0";

      const userIp = userIpSource.toString()
        .split(",")[0]
        .trim()
        .replace("::ffff:", "") ||
        "0.0.0.0";
      const userAgentHeader = request.get("user-agent") || fallbackUserAgent;
      const sanitizedUserAgent = userAgentHeader.substring(0, 255);

      const queryParams = new URLSearchParams({
        app_id: appId,
        app_key: appKey,
        what: whatQuery,
        where: whereQuery,
        results_per_page: resultsPerPage,
        sort_by: "date",
        content_type: contentType,
        user_ip: userIp,
        user_agent: sanitizedUserAgent,
      });

      if (remoteFlag && remoteFlag !== "false") {
        queryParams.append("telecommuting", "1");
      }

      const country = "us";
      const page = 1;
      const url = [
        `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`,
        queryParams.toString(),
      ].join("?");

      logger.info("Proxying Adzuna request", {
        what: whatQuery,
        where: whereQuery,
        isRemote: remoteFlag,
        userIp,
      });

      const apiResponse = await fetch(url, {
        headers: {
          "User-Agent": sanitizedUserAgent,
          "Accept": "application/json",
        },
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        logger.error("Adzuna API error", {
          status: apiResponse.status,
          text: errorText,
        });
        response.status(apiResponse.status).send(errorText);
        return;
      }

      const data = await apiResponse.json();
      response.json(data);
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error("Adzuna proxy error", error);
        response.status(500).json({error: error.message});
        return;
      }

      logger.error("Adzuna proxy error", {error});
      response.status(500).json({error: "Unknown error"});
    }
  });
});
