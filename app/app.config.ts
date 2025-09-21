export default defineAppConfig({
  ui: {
    badge: {
      variants: {
        size: {
          lg: { base: "rounded-xl" },
          md: { base: "rounded-xl" },
          sm: { base: "rounded-xl" },
        },
      },
    },
    button: {
      slots: {
        base: "cursor-pointer rounded-xl",
      },
    },
    selectMenu: {
      slots: {
        content: "min-w-fit rounded-xl",
      },
    },
    select: {
      slots: {
        content: "min-w-fit rounded-xl",
      },
    },
    tabs: {
      slots: {
        trigger: "cursor-pointer",
      },
    },
  },
});
