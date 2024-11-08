import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { hashApiKey } from "../lib/apiauth.js";

const generateHmacSecret = (length = 64): string => {
  const bytes = crypto.randomBytes(length);
  return bytes.toString("base64");
};

const generateApiKey = (length = 32): string => {
  const bytes = crypto.randomBytes(length);
  return bytes.toString("base64");
};

interface Args {
  outDir?: string;
  format?: "json" | "env" | "both";
  keyLength?: number;
  secretLength?: number;
}

const main = async () => {
  const argv = (await yargs(hideBin(process.argv))
    .option("outDir", {
      type: "string",
      description: "Output directory",
      default: "generated_api_secrets",
    })
    .option("keyLength", {
      type: "number",
      description: "Length of API key in bytes",
      default: 32,
    })
    .option("secretLength", {
      type: "number",
      description: "Length of HMAC secret in bytes",
      default: 64,
    }).argv) as Args;

  const hmacSecret = generateHmacSecret(argv.secretLength);
  const apiKey = generateApiKey(argv.keyLength);
  const apiKeyHash = hashApiKey(apiKey, hmacSecret);

  const outputDir = path.join(
    argv.outDir ?? "generated",
    Date.now().toString(),
  );
  await fs.mkdir(outputDir, { recursive: true });

  const envContent = `M2M_API_KEY_HMAC=${hmacSecret}\nM2M_API_KEY_HASH=${apiKeyHash}\n`;
  await fs.writeFile(path.join(outputDir, "server_config.env"), envContent);

  const clientConfig = `M2M_API_KEY=${apiKey}`;
  await fs.writeFile(path.join(outputDir, "client_config.env"), clientConfig);

  const awsSecretContent = JSON.stringify(
    {
      allowedTokenHash: apiKeyHash,
      Hmac: hmacSecret,
    },
    null,
    2,
  );

  await fs.writeFile(path.join(outputDir, "secrets.json"), awsSecretContent);

  console.log("\nGenerated Secrets ");
  console.log("API Key:", apiKey);
  console.log("HMAC Secret:", hmacSecret);
  console.log("API Key Hash:", apiKeyHash);
  console.log("\nSecrets have been saved to:", outputDir);
  console.log("\nFor AWS Secrets Manager:");
  console.log(awsSecretContent);
};

await main();
