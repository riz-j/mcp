import { executeSearch } from "./utils";

const result = await executeSearch<any>("clients", "");
console.log(result);