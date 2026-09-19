export type {
  CurrentUserContext,
  PermissionCode,
  RoleName,
  School,
  UserProfile,
} from "./types";

export {
  checkIsMyClassSubject,
  checkPermission,
  fetchMyPermissions,
  fetchMyRole,
  fetchMySchoolId,
  resolveRoleIdByName,
} from "./permissions";

export { useCurrentUser } from "./useCurrentUser";

export {
  canRoleAccessPath,
  getHomePathForRole,
  getSpaceForPath,
  isDirectionSpacePath,
  isTeacherSpacePath,
  rolesAllowedInSpace,
  type AppSpace,
} from "./routes";
