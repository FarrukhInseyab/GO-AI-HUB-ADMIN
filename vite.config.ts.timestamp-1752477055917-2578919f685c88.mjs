// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    // Force HTTP protocol for development
    https: false,
    port: 5173,
    // Enable SPA fallback for development
    historyApiFallback: true
  },
  build: {
    // Ensure proper asset handling for deployment
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: void 0
      }
    }
  },
  base: "/",
  // Use absolute paths for deployment
  preview: {
    // Enable SPA fallback for preview mode
    historyApiFallback: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICBzZXJ2ZXI6IHtcbiAgICAvLyBGb3JjZSBIVFRQIHByb3RvY29sIGZvciBkZXZlbG9wbWVudFxuICAgIGh0dHBzOiBmYWxzZSxcbiAgICBwb3J0OiA1MTczLFxuICAgIC8vIEVuYWJsZSBTUEEgZmFsbGJhY2sgZm9yIGRldmVsb3BtZW50XG4gICAgaGlzdG9yeUFwaUZhbGxiYWNrOiB0cnVlXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgLy8gRW5zdXJlIHByb3BlciBhc3NldCBoYW5kbGluZyBmb3IgZGVwbG95bWVudFxuICAgIGFzc2V0c0RpcjogJ2Fzc2V0cycsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczogdW5kZWZpbmVkLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBiYXNlOiAnLycsIC8vIFVzZSBhYnNvbHV0ZSBwYXRocyBmb3IgZGVwbG95bWVudFxuICBwcmV2aWV3OiB7XG4gICAgLy8gRW5hYmxlIFNQQSBmYWxsYmFjayBmb3IgcHJldmlldyBtb2RlXG4gICAgaGlzdG9yeUFwaUZhbGxiYWNrOiB0cnVlXG4gIH1cbn0pIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFHbEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLFFBQVE7QUFBQTtBQUFBLElBRU4sT0FBTztBQUFBLElBQ1AsTUFBTTtBQUFBO0FBQUEsSUFFTixvQkFBb0I7QUFBQSxFQUN0QjtBQUFBLEVBQ0EsT0FBTztBQUFBO0FBQUEsSUFFTCxXQUFXO0FBQUEsSUFDWCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsTUFDaEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsTUFBTTtBQUFBO0FBQUEsRUFDTixTQUFTO0FBQUE7QUFBQSxJQUVQLG9CQUFvQjtBQUFBLEVBQ3RCO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
