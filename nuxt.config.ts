// Nuxt configuration with Nuxt UI, Pinia, VueUse, and Nuxt Image
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: "2025-09-21",
  modules: ["@nuxt/ui", "@pinia/nuxt", "@vueuse/nuxt", "@nuxt/image"],
  css: ["~/assets/css/main.css"],
  typescript: {
    strict: true,
    shim: false,
  },
  runtimeConfig: {
    public: {},
  },
  imports: {
    dirs: ["config", "stores"],
  },
  app: {
    head: {
      title: "Aquarium Game (Nuxt)",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    },
  },
});
