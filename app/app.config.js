/** @type {import('expo/config').ExpoConfig} */
export default ({ config }) => {
  const baseUrl = process.env.EXPO_BASE_URL ?? "/app";
  const scope = baseUrl === "/" ? "/" : baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return {
    ...config,
    experiments: {
      ...config.experiments,
      baseUrl: baseUrl === "/" ? "" : baseUrl.replace(/\/$/, ""),
    },
    web: {
      ...config.web,
      startUrl: scope,
      scope,
    },
  };
};
