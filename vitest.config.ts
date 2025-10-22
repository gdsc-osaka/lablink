import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    define: {
        "import.meta.vitest": false,
    },
    plugins: [
        tsconfigPaths(), // @/** path alias support
    ],
    test: {
        environment: "jsdom", // TODO: switch to 'happy-dom'
        globals: true,
        setupFiles: "./vitest.setup.ts",
        include: ["test/**/*.test.ts", "src/**/__tests__/*.test.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
        },
    },
});
