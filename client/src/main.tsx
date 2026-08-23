import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { customerQueryClient } from "./api/query-client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={customerQueryClient}>
    <App />
  </QueryClientProvider>,
);
