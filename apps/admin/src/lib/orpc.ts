import { contract } from "@food-map/shared/contract";
import { createORPCClient } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import type { JsonifiedClient } from "@orpc/openapi-client";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

const link = new OpenAPILink(contract, {
  url: `${window.location.origin}/api`,
});

const client: JsonifiedClient<ContractRouterClient<typeof contract>> = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
