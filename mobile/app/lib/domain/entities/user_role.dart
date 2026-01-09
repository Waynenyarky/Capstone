enum UserRole {
  inspector,
  unknown
}

UserRole parseUserRole(String? role) {
  // Default everything to Inspector as requested
  return UserRole.inspector;
}

String getRoleDisplayName(UserRole role) {
  switch (role) {
    case UserRole.inspector:
      return 'Inspector';
    case UserRole.unknown:
      return 'Inspector'; // Fallback
  }
}
