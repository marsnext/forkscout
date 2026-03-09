// path — run_web_search_test.ts
import { web_search_tools } from "./.agents/tools/web_search_tools.ts";

const result = await web_search_tools.execute({
  query: "bitcoin price today March 7 2026",
  maxResults: 3,
});

console.log(JSON.stringify(result, null, 2));
