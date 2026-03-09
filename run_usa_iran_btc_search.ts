// path — run_usa_iran_btc_search.ts
import { web_search_tools } from "./.agents/tools/web_search_tools.ts";

const result = await web_search_tools.execute({
  query: "bitcoin price today March 7 2026 usa iran conflict impact",
  maxResults: 3,
});

console.log(JSON.stringify(result, null, 2));
