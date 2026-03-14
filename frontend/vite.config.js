<<<<<<< HEAD
/* global process */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        // Proxy API requests in dev to avoid CORS / port-forwarding issues
        proxy: {
            '/api': {
                target: process.env.VITE_BACKEND_URL || 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
})
=======
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    base: "/",

    plugins: [
        react(),
        tailwindcss()
    ],

    server: {
        port: 5173
    },

    resolve: {
        alias: {
            "@": "/src"
        }
    }
});
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
