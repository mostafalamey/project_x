import { useEffect } from "react";

import { useTheme } from "./hooks/useTheme";
import { AppRouter } from "./routes";

const App = () => {
  const { resolvedTheme } = useTheme();

  // Apply theme class to html element
  useEffect(() => {
    const root = document.documentElement;

    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [resolvedTheme]);

  return <AppRouter />;
};

export default App;
