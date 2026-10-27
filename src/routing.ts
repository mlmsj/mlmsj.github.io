const ensureLeadingSlash = (path: string) =>
  path.startsWith("/") ? path : `/${path}`;

const withoutTrailingSlash = (path: string) =>
  path.length > 1 ? path.replace(/\/+$/, "") : path;

export const normalizeBasePath = (path: string) =>
  withoutTrailingSlash(ensureLeadingSlash(path));

export const basePath = normalizeBasePath(import.meta.env.BASE_URL);

export const appPathFromLocationForBase = (
  pathname: string,
  deploymentBasePath: string,
) => {
  const normalizedBasePath = normalizeBasePath(deploymentBasePath);
  const normalizedPath = withoutTrailingSlash(ensureLeadingSlash(pathname));

  if (normalizedBasePath === "/") return normalizedPath;
  if (normalizedPath === normalizedBasePath) return "/";
  if (normalizedPath.startsWith(`${normalizedBasePath}/`)) {
    return normalizedPath.slice(normalizedBasePath.length) || "/";
  }

  return normalizedPath;
};

export const appPathFromLocation = (pathname: string) =>
  appPathFromLocationForBase(pathname, basePath);

export const locationPathForAppPathForBase = (
  appPath: string,
  deploymentBasePath: string,
  origin: string,
) => {
  const normalizedBasePath = normalizeBasePath(deploymentBasePath);
  const url = new URL(appPath, origin);
  const normalizedPath = withoutTrailingSlash(ensureLeadingSlash(url.pathname));
  const pathWithoutBase = appPathFromLocationForBase(
    normalizedPath,
    normalizedBasePath,
  );
  const pathname =
    normalizedBasePath === "/"
      ? pathWithoutBase
      : pathWithoutBase === "/"
        ? `${normalizedBasePath}/`
        : `${normalizedBasePath}${pathWithoutBase}`;

  return `${pathname}${url.search}${url.hash}`;
};

export const locationPathForAppPath = (appPath: string) =>
  locationPathForAppPathForBase(appPath, basePath, window.location.origin);
