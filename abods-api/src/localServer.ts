import { app } from "./index.js";

const port = process.env.PORT ?? 3000;

app.listen(port, () => {
  console.log(`Local server running at http://localhost:${port}`);
});
