import runFileDatabaseTests from "./fileDatabase.test.js";
import runServerTests from "./server.test.js";

const fileDatabaseRootPath = './test/media';
const testPort = 61549;

await runFileDatabaseTests(fileDatabaseRootPath);
await runServerTests(fileDatabaseRootPath, testPort);