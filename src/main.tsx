import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import App from "./App";
import { queryClient } from "./config/queryClient";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipPrimitive.Provider delayDuration={150}>
          <App />
        </TooltipPrimitive.Provider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
