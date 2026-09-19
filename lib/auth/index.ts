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
