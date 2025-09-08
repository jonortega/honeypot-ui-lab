export const baitRoutes = [
  // admin/auth
  "/admin",
  "/admin/login",
  "/auth/login",
  "/api/login",
  "/api/auth/login",
  // WordPress
  "/wp-login.php",
  "/xmlrpc.php",
  "/wp-json/wp/v2/users",
  // Paneles comunes
  "/phpmyadmin",
  "/phpinfo.php",
  "/config.php",
  // Fugas típicas
  "/.env",
  "/.git/HEAD",
  "/.git/config",
  // Status/endpoints comunes
  "/server-status",
  "/actuator/health",
  // Upload
  "/upload",
  "/api/upload",
] as const;
