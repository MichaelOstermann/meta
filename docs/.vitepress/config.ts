import { defineConfig } from "vitepress"
import { groupIconMdPlugin, groupIconVitePlugin, localIconLoader } from "vitepress-plugin-group-icons"

export default defineConfig({
    base: "/meta/",
    description: "Tools to attach metadata to call expressions.",
    title: "meta",
    markdown: {
        theme: {
            dark: "catppuccin-macchiato",
            light: "github-light-default",
        },
        config(md) {
            md.use(groupIconMdPlugin)
        },
    },
    themeConfig: {
        aside: false,
        outline: "deep",
        docFooter: {
            next: false,
            prev: false,
        },
        search: {
            provider: "local",
        },
        sidebar: [
            {
                base: "/meta/",
                text: "meta",
                items: [
                    { link: "getMeta", text: "getMeta" },
                    { link: "hasMeta", text: "hasMeta" },
                    { link: "withMeta", text: "withMeta" },
                    { link: "isMeta", text: "isMeta" },
                    { link: "getMetaStack", text: "getMetaStack" },
                    { link: "stringifyMeta", text: "stringifyMeta" },
                    { link: "fallbackMeta", text: "fallbackMeta" },
                ],
            },
            {
                base: "/Presets/",
                text: "Presets",
                items: [
                    { link: "wrapWithMeta", text: "wrapWithMeta" },
                    { link: "addMetaParam", text: "addMetaParam" },
                    { link: "setMetaParam", text: "setMetaParam" },
                ],
            },
            {
                base: "/Custom/",
                text: "Custom",
                items: [
                    { link: "Example", text: "Example" },
                    { link: "code", text: "code" },
                    { link: "filePath", text: "filePath" },
                    { link: "ast", text: "ast" },
                    { link: "ms", text: "ms" },
                    { link: "usedIds", text: "usedIds" },
                    { link: "ids", text: "ids" },
                    { link: "generateId", text: "generateId" },
                    { link: "getCallExpressionName", text: "getCallExpressionName" },
                    { link: "getMetaLine", text: "getMetaLine" },
                    { link: "getMetaName", text: "getMetaName" },
                    { link: "getMetaPath", text: "getMetaPath" },
                    { link: "getParentNodes", text: "getParentNodes" },
                    { link: "injectCode", text: "injectCode" },
                    { link: "injectImport", text: "injectImport" },
                    { link: "injectMetaImport", text: "injectMetaImport" },
                    { link: "injectMetaPath", text: "injectMetaPath" },
                    { link: "injectMetaRecord", text: "injectMetaRecord" },
                    { link: "injectMetaParam", text: "injectMetaParam" },
                    { link: "injectMetaWrapper", text: "injectMetaWrapper" },
                    { link: "injectHmrSetup", text: "injectHmrSetup" },
                ],
            },
        ],
        socialLinks: [
            { icon: "github", link: "https://github.com/MichaelOstermann/meta" },
        ],
    },
    vite: {
        plugins: [
            groupIconVitePlugin({
                customIcon: {
                    rolldown: "vscode-icons:file-type-rolldown",
                    rspack: localIconLoader(import.meta.url, "../assets/rspack-logo.svg"),
                },
            }),
        ],
    },
})
