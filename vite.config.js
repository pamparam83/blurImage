import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
    build: {
        outDir: resolve(__dirname, 'dist'),
        emptyOutDir: true,
        rollupOptions: {
            input: {
                popup: resolve(__dirname, 'src/popup/index.html'),
                background: resolve(__dirname, 'src/background/index.js'),
                content: resolve(__dirname, 'src/content/index.js'),
            },
            output: {
                entryFileNames: (chunkInfo) => {
                    if (chunkInfo.facadeModuleId && chunkInfo.facadeModuleId.includes('background')) {
                        return 'background.js';
                    }
                    if (chunkInfo.facadeModuleId && chunkInfo.facadeModuleId.includes('content')) {
                        return 'content.js';
                    }
                    return `assets/[name].js`;
                },
                chunkFileNames: `assets/[name].js`,
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name === 'index.html') {
                        return 'index.html';
                    }
                    if (assetInfo.name === 'style.css') {
                        return 'style.css';
                    }
                    return `assets/[name].[ext]`;
                }
            }
        }
    },
    plugins: [
        viteStaticCopy({
            targets: [
                {
                    src: 'icons',
                    dest: '.'
                },
                {
                    src: 'manifest.json',
                    dest: '.'
                },
                {
                    src: 'src/popup/style.css',
                    dest: '.'
                }
            ]
        })
    ]
});