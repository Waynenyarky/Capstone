enum UserRole {
  businessOwner,
  lguOfficer,
  lguManager,
  inspector,
  admin,
  cso,
  unknown
}

UserRole parseUserRole(String? role) {
  switch (role?.toLowerCase().trim()) {
    case 'business owner':
    case 'business_owner':
    case 'businessowner':
      return UserRole.businessOwner;
    case 'lgu officer':
    case 'lgu_officer':
    case 'lguofficer':
      return UserRole.lguOfficer;
    case 'lgu manager':
    case 'lgu_manager':
    case 'lgumanager':
      return UserRole.lguManager;
    case 'inspector':
      return UserRole.inspector;
    case 'admin':
      return UserRole.admin;
    case 'customer support officer':
    case 'cso':
      return UserRole.cso;
    case 'user':
      return UserRole.businessOwner;
    default:
      return UserRole.businessOwner; // Default to Business Owner instead of unknown
  }
}

String getRoleDisplayName(UserRole role) {
  switch (role) {
    case UserRole.businessOwner:
      return 'Business Owner';
    case UserRole.lguOfficer:
      return 'LGU Officer';
    case UserRole.lguManager:
      return 'LGU Manager';
    case UserRole.inspector:
      return 'Inspector';
    case UserRole.admin:
      return 'Admin';
    case UserRole.cso:
      return 'Customer Support Officer';
    case UserRole.unknown:
      return 'Business Owner'; // Fallback
  }
}
